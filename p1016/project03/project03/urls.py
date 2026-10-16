from django.contrib import admin
from django.urls import path,include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('home.urls')),
    path('board/', include('board.urls')),
]

# 파일업로드시 url구성이 되어 있어야 파일을 업로드할수 있음.
# if settings.DEBUG:
#     urlpatterns += static(settings.MEDIA_URL,
#     document_root = settings.MEDIA_ROOT
#     )

urlpatterns += static(settings.MEDIA_URL,
document_root = settings.MEDIA_ROOT
)
