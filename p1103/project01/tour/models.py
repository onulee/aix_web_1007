from django.db import models
from django.conf import settings

class Tour(models.Model):
    region = models.CharField(max_length=20)    # 지역코드 gw, seoul...
    rank = models.IntegerField()                # 순위
    tid = models.CharField(max_length=50)       # 관광지ID
    sigungu = models.CharField(max_length=30)   # 시군구
    name = models.CharField(max_length=100)     # 관심지점명
    category = models.CharField(max_length=30)  # 구분
    age = models.IntegerField()                 # 연령대 20~60
    ratio = models.FloatField()                 # 비율
    lat = models.FloatField()                   # 위도
    lng = models.FloatField()                   # 경도

    def __str__(self):
        return f'{self.region},{self.age},{self.rank},{self.name}'

    # 사진경로 : 사진이 있으면 그 사진, 없으면 noimage
    @property
    def img(self):
        fname = self.name.replace(' ', '') + '.jpg'
        folder = settings.BASE_DIR / 'static' / 'images' / 'tour' / self.region
        if (folder / fname).exists():
            return f'images/tour/{self.region}/{fname}'
        # 압축을 풀 때 한글 파일명이 #Uxxxx 형태로 깨진 경우도 찾기
        fname2 = ''.join(c if ord(c) < 128 else f'#U{ord(c):04x}' for c in fname)
        if (folder / fname2).exists():
            return f'images/tour/{self.region}/{fname2}'
        return 'images/tour/noimage.jpg'
