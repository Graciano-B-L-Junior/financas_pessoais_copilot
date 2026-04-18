from django.utils.deprecation import MiddlewareMixin


class JWTAuthCookieMiddleware(MiddlewareMixin):
    """If an `access` cookie exists, copy it into the Authorization header
    so DRF's JWTAuthentication can pick it up.
    """

    def process_request(self, request):
        access = request.COOKIES.get('access')
        if access and not request.META.get('HTTP_AUTHORIZATION'):
            request.META['HTTP_AUTHORIZATION'] = f'Bearer {access}'
