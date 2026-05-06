from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from django.utils import timezone
from decimal import Decimal
import random
from datetime import timedelta
import os

from apps.categories.models import Category
from apps.budgets.models import Budget, BudgetCategory
from apps.transactions.models import Transaction
from django.db import transaction, connection
from django.db.utils import OperationalError as DBOperationalError


class Command(BaseCommand):
    help = "Seed sample categories, transactions and budgets for a given user"

    def add_arguments(self, parser):
        parser.add_argument("--username", type=str, help="Username of target user")
        parser.add_argument("--email", type=str, help="Email of target user")
        parser.add_argument("--select", action="store_true", help="Interactively select a user")
        parser.add_argument("--transactions", type=int, default=10, help="Number of sample transactions to create (total)")
        parser.add_argument("--budgets", type=int, default=1, help="Number of monthly budgets to create")
        parser.add_argument("--force", action="store_true", help="Remove existing seed transactions for the user before seeding")

    def handle(self, *args, **options):
        User = get_user_model()
        username = options.get("username")
        email = options.get("email")
        select = options.get("select")
        total_transactions = options.get("transactions") or 10
        total_budgets = options.get("budgets") or 1
        force = options.get("force")

        # verify DB connectivity early to provide helpful error message
        try:
            connection.ensure_connection()
        except DBOperationalError as exc:
            # Attempt a common fallback when settings point to the docker service name (e.g. 'db')
            from django.conf import settings as dj_settings
            current_host = dj_settings.DATABASES.get('default', {}).get('HOST')
            current_port = str(dj_settings.DATABASES.get('default', {}).get('PORT') or '')

            should_try_fallback = False
            if current_host in ("db", "postgres", "postgresql"):
                should_try_fallback = True
            # common local case: settings use localhost:5432 but docker maps container to 5433
            if current_host in ("localhost", "127.0.0.1", None, "") and current_port in ("", "5432"):
                should_try_fallback = True

            if should_try_fallback:
                fallback_host = os.environ.get("DB_HOST_FALLBACK", "localhost")
                fallback_port = os.environ.get("DB_PORT_FALLBACK", "5433")

                # try to load DB credentials from backend/.env.dev if present
                try:
                    from pathlib import Path
                    env_path = Path(dj_settings.BASE_DIR) / ".env.dev"
                    parsed = {}
                    if env_path.exists():
                        for line in env_path.read_text().splitlines():
                            line = line.strip()
                            if not line or line.startswith('#'):
                                continue
                            if '=' in line:
                                k, v = line.split('=', 1)
                                parsed[k.strip()] = v.strip()
                    fallback_user = parsed.get('DB_USER') or os.environ.get('DB_USER')
                    fallback_password = parsed.get('DB_PASSWORD') or os.environ.get('DB_PASSWORD')
                    fallback_db = parsed.get('DB_NAME') or os.environ.get('DB_NAME')
                except Exception:
                    fallback_user = os.environ.get('DB_USER')
                    fallback_password = os.environ.get('DB_PASSWORD')
                    fallback_db = os.environ.get('DB_NAME')

                if fallback_user:
                    dj_settings.DATABASES['default']['USER'] = fallback_user
                if fallback_password:
                    dj_settings.DATABASES['default']['PASSWORD'] = fallback_password
                if fallback_db:
                    dj_settings.DATABASES['default']['NAME'] = fallback_db

                dj_settings.DATABASES['default']['HOST'] = fallback_host
                dj_settings.DATABASES['default']['PORT'] = fallback_port
                # ensure connections are re-established with new settings
                from django import db as django_db
                django_db.connections.close_all()
                try:
                    connection.ensure_connection()
                    self.stdout.write(self.style.WARNING(f"DB connection failed to {current_host}; switched to {fallback_host}:{fallback_port} for this run."))
                except DBOperationalError:
                    raise CommandError(
                        "Database connection failed: %s.\nTried fallback to %s:%s but it also failed.\nPlease ensure DB is reachable or set DB_HOST/DB_PORT appropriately." % (str(exc), fallback_host, fallback_port)
                    )
            else:
                raise CommandError(
                    "Database connection failed: %s.\nIf you're running manage.py locally while the DB runs in Docker, set DB_HOST=localhost and DB_PORT=5433 (or the port mapped in docker-compose)." % str(exc)
                )

        user = None
        if username:
            user = User.objects.filter(username=username).first()
        elif email:
            user = User.objects.filter(email=email).first()
        elif select:
            users = list(User.objects.all().order_by("id")[:50])
            if not users:
                raise CommandError("No users found to select.")
            self.stdout.write("Select a user to seed:")
            for idx, u in enumerate(users, start=1):
                self.stdout.write(f"{idx}. {u.username} ({u.email}) [id={u.pk}]")
            choice = input("Enter number of user: ").strip()
            try:
                idx = int(choice)
                if idx < 1 or idx > len(users):
                    raise ValueError()
                user = users[idx - 1]
            except Exception:
                raise CommandError("Invalid selection")
        else:
            raise CommandError("Please provide --username, --email or --select to choose a user to seed")

        if not user:
            raise CommandError(f"User not found: username={username} email={email}")

        income_categories = ["Salário", "Freelance", "Investimentos"]
        expense_categories = ["Alimentação", "Transporte", "Lazer", "Moradia", "Saúde", "Educação"]

        created_categories = []
        created_tx = 0
        created_budgets = 0

        today = timezone.now().date()
        budget_months = []
        for offset in range(max(total_budgets, 1)):
            month_base = today.replace(day=1)
            current_year = month_base.year
            current_month = month_base.month - offset
            while current_month <= 0:
                current_year -= 1
                current_month += 12
            budget_months.append(month_base.replace(year=current_year, month=current_month))

        with transaction.atomic():
            if force:
                # Remove transactions previously created by this seed command (description starts with 'Seed:')
                deleted = Transaction.objects.filter(user=user, description__startswith="Seed:").delete()
                deleted_count = deleted[0] if isinstance(deleted, tuple) else deleted
                self.stdout.write(self.style.WARNING(f"Removed {deleted_count} existing seed transactions for user {user.username}."))
                deleted_budgets = Budget.objects.filter(user=user, month__in=budget_months).delete()
                deleted_budget_count = deleted_budgets[0] if isinstance(deleted_budgets, tuple) else deleted_budgets
                self.stdout.write(self.style.WARNING(f"Removed {deleted_budget_count} existing seed budgets for user {user.username}."))
            # create or get categories
            for name in income_categories:
                cat, created = Category.objects.get_or_create(
                    user=user, name=name, type=Category.TYPE_INCOME, defaults={"description": "Categoria seed"}
                )
                created_categories.append(cat)

            for name in expense_categories:
                cat, created = Category.objects.get_or_create(
                    user=user, name=name, type=Category.TYPE_EXPENSE, defaults={"description": "Categoria seed"}
                )
                created_categories.append(cat)

            random.seed(0)
            days_back = 90

            for i in range(total_transactions):
                cat = random.choice(created_categories)
                if cat.type == Category.TYPE_INCOME:
                    amount_val = random.uniform(500.0, 5000.0)
                else:
                    amount_val = random.uniform(5.0, 300.0)

                amount = Decimal(str(round(amount_val, 2)))
                date = timezone.now().date() - timedelta(days=random.randint(0, days_back))
                description = f"Seed: {cat.name} {date.isoformat()} #{i}"

                exists = Transaction.objects.filter(user=user, description=description, amount=amount, date=date).exists()
                if exists:
                    continue

                Transaction.objects.create(
                    user=user,
                    category=cat,
                    description=description,
                    amount=amount,
                    type=cat.type,
                    date=date,
                    is_recurring=False,
                )
                created_tx += 1

            expense_categories_objects = [category for category in created_categories if category.type == Category.TYPE_EXPENSE]
            for budget_month in budget_months:
                total_amount = Decimal("0")
                budget_items = []

                for category in expense_categories_objects:
                    budgeted_amount = Decimal(str(round(random.uniform(150.0, 900.0), 2)))
                    budget_items.append((category, budgeted_amount))
                    total_amount += budgeted_amount

                budget, created = Budget.objects.update_or_create(
                    user=user,
                    month=budget_month,
                    defaults={
                        "status": Budget.STATUS_ACTIVE,
                        "total_amount": total_amount,
                    },
                )

                budget.categories.all().delete()
                BudgetCategory.objects.bulk_create(
                    [
                        BudgetCategory(
                            budget=budget,
                            category=category,
                            budgeted_amount=budgeted_amount,
                        )
                        for category, budgeted_amount in budget_items
                    ]
                )
                budget.calculate_execution(persist=True)
                created_budgets += 1

        self.stdout.write(self.style.SUCCESS(f"Seed completed for user {user.username} (id={user.pk})."))
        self.stdout.write(self.style.SUCCESS(f"Categories ensured: {len(created_categories)}. Transactions created: {created_tx}"))
        self.stdout.write(self.style.SUCCESS(f"Budgets ensured: {created_budgets}."))
