from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed
from .models import User

class CustomJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        try:
            user_id = validated_token['user_id']
            return User.objects.get(UserID=user_id)  # Changed from 'id' to 'UserID'
        except User.DoesNotExist:
            raise AuthenticationFailed('User not found')
        except KeyError:
            raise InvalidToken('Token contained no valid user identification')