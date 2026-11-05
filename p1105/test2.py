import pandas as pd
from sklearn import svm,metrics
from sklearn.model_selection import train_test_split

# 글자 숫자로 변경함수
def nameChange(species):
    if species == 'Iris-setosa':
        return 0
    elif species == 'Iris-versicolor':
        return 1
    else:
        return 2

df = pd.read_csv('p1105/data/iris.csv',index_col='caseno')
print(df.columns)             # 컬럼명 출력
print(df['Species'].unique()) # 중복된 row1개만 출력
print(df.info())
print(df.describe())


data = df[['SepalLength', 'SepalWidth', 'PetalLength', 'PetalWidth']]
df['Species'] = df['Species'].apply(nameChange)  # 함수호출, 변경값:df 적용
label = df['Species']
# sklearn 라이브러리에서 랜덤으로 실습데이터,테스트데이터 분리
train_data,test_data,train_label,test_label = train_test_split(data,label)
print(train_data)
print(train_label)
clf = svm.SVC()

clf.fit(train_data,train_label)

result =clf.predict(test_data)
print('결과값 : ',result)  # 0-setosa

score = metrics.accuracy_score(result,test_label)
print('정답률 : ',score)
    