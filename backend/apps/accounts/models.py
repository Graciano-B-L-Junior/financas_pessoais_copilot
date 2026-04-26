from django.db import models


class AccountMarker(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        verbose_name = "account marker"