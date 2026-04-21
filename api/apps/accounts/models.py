from django.db import models
from django.conf import settings

class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    locale = models.CharField(max_length=10, default='pt_BR')

    def __str__(self):
        return f'Profile/{self.user.username}'
