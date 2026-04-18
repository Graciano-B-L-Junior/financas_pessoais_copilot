from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('transactions', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='RecurringTransaction',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('amount', models.DecimalField(decimal_places=2, max_digits=12)),
                ('start_date', models.DateField()),
                ('next_date', models.DateField(blank=True, null=True)),
                ('frequency', models.CharField(choices=[('daily', 'Diário'), ('weekly', 'Semanal'), ('monthly', 'Mensal')], max_length=10)),
                ('active', models.BooleanField(default=True)),
                ('description', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('category', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='transactions.category')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='auth.user')),
            ],
        ),
    ]
