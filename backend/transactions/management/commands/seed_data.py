from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from transactions.models import Category, Transaction, RecurringTransaction
from decimal import Decimal
from faker import Faker
from datetime import date, timedelta, datetime
import random

fake = Faker('pt_BR')

class Command(BaseCommand):
    help = 'Seed database with mocked users, categories, transactions for 1-3 years'

    def add_arguments(self, parser):
        parser.add_argument('--years', type=int, default=1, choices=[1,2,3], help='Number of years of history (1-3)')
        parser.add_argument('--users', type=int, default=3, help='Number of users to create')
        parser.add_argument('--tx-per-month', type=int, default=40, help='Approx transactions per user per month')
        parser.add_argument('--seed', type=int, default=None, help='Random seed')

    def handle(self, *args, **options):
        years = options['years']
        num_users = options['users']
        tx_per_month = options['tx_per_month']
        seed = options.get('seed')

        if seed is not None:
            random.seed(seed)
            Faker.seed(seed)

        today = date.today()
        start_date = today - timedelta(days=365*years)

        self.stdout.write(self.style.NOTICE(f'Creating data for {num_users} users, {years} years (from {start_date} to {today})'))

        users = []
        for i in range(num_users):
            username = f'user{i+1}'
            email = f'user{i+1}@example.com'
            password = 'password'
            user, created = User.objects.get_or_create(username=username, defaults={'email': email})
            if created:
                user.set_password(password)
                user.save()
            users.append(user)

            # Create some categories per user
            default_cats = ['Alimentos', 'Transporte', 'Lazer', 'Moradia', 'Saúde', 'Renda']
            for cname in default_cats:
                Category.objects.get_or_create(user=user, name=cname)

        # For each user, create recurring incomes and expenses and many transactions
        for user in users:
            cats = list(Category.objects.filter(user=user))
            income_cat = next((c for c in cats if c.name == 'Renda'), cats[0])

            # Create a recurring salary (monthly)
            RecurringTransaction.objects.get_or_create(
                user=user,
                category=income_cat,
                amount=Decimal('3000.00'),
                start_date=start_date,
                frequency=RecurringTransaction.FREQUENCY_MONTHLY,
                defaults={'next_date': start_date, 'active': True, 'description': 'Salário'}
            )

            # Create some random recurring expenses
            for freq in [RecurringTransaction.FREQUENCY_MONTHLY, RecurringTransaction.FREQUENCY_WEEKLY]:
                cat = random.choice([c for c in cats if c.name != 'Renda'])
                RecurringTransaction.objects.get_or_create(
                    user=user,
                    category=cat,
                    amount=Decimal(str(round(random.uniform(30, 300), 2))),
                    start_date=start_date,
                    frequency=freq,
                    defaults={'next_date': start_date, 'active': True, 'description': f'Recorrente {cat.name}'}
                )

            # Generate transactions monthly
            cursor = start_date
            while cursor <= today:
                # approximate number of transactions this month
                n = max(1, int(random.gauss(tx_per_month, tx_per_month * 0.2)))
                for _ in range(n):
                    # random day within month
                    day = random.randint(1, 28)
                    tx_date = date(cursor.year, cursor.month, day)

                    # choose category
                    cat = random.choice(cats)

                    # income probability lower
                    if random.random() < 0.1:
                        # income
                        amt = Decimal(str(round(random.uniform(500, 5000), 2)))
                    else:
                        amt = Decimal(str(round(random.uniform(5, 800), 2))) * Decimal('-1')

                    Transaction.objects.create(
                        user=user,
                        category=cat,
                        amount=amt,
                        date=tx_date,
                        description=fake.sentence(nb_words=6)
                    )

                # advance one month
                year = cursor.year + (cursor.month // 12)
                month = (cursor.month % 12) + 1
                cursor = date(year, month, 1)

        self.stdout.write(self.style.SUCCESS('Seeding complete'))
