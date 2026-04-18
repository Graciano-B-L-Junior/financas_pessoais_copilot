from celery import shared_task
from django.utils import timezone


@shared_task
def sample_task():
    """Simple task that can be scheduled to verify Celery is running."""
    now = timezone.now()
    # In a real task you could aggregate data or send notifications
    return f"sample at {now.isoformat()}"


@shared_task
def process_recurring_transactions():
    """Find recurring transactions due and create Transaction entries."""
    from .models import RecurringTransaction, Transaction
    from django.utils import timezone
    from datetime import timedelta

    today = timezone.localdate()
    created = 0
    for r in RecurringTransaction.objects.filter(active=True):
        # Determine if it's due
        due = False
        if r.next_date:
            due = r.next_date <= today
        else:
            due = r.start_date <= today

        if not due:
            continue

        # create a Transaction
        Transaction.objects.create(
            user=r.user,
            category=r.category,
            amount=r.amount,
            date=r.next_date or r.start_date,
            description=r.description or '',
        )
        created += 1

        # advance next_date
        if r.frequency == RecurringTransaction.FREQUENCY_DAILY:
            delta = timedelta(days=1)
        elif r.frequency == RecurringTransaction.FREQUENCY_WEEKLY:
            delta = timedelta(weeks=1)
        else:
            # monthly: naive add 30 days
            delta = timedelta(days=30)

        next_dt = (r.next_date or r.start_date) + delta
        r.next_date = next_dt
        r.save()

    return {'created': created}
