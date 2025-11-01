from django.urls import path

from .views import EncodeView

urlpatterns = [
    path("encode", EncodeView.as_view()),
]