import pandas as pd, glob
from tour.models import Tour

# 1. 기존 데이터 삭제
Tour.objects.all().delete()

# 2. CSV 파일 5개 반복
for f in glob.glob('data/total_*_corrected.csv'):
    df = pd.read_csv(f, encoding='utf-8-sig')
    print(f, len(df), '건')

    # 3. 한 줄씩 Tour 객체로 변환
    objs = [Tour(region=r.지역코드, rank=r.순위, tid=r.관광지ID, sigungu=r.시군구,
                 name=r.관심지점명, category=r.구분, age=r.연령대, ratio=r.비율,
                 lat=r.위도, lng=r.경도) for r in df.itertuples()]

    # 4. 한 번에 저장
    Tour.objects.bulk_create(objs)

print('저장 건수 :', Tour.objects.count())