
from sklearn import svm,metrics

data = [[0, 0],[1, 0],[0, 1],[1, 1]]
label = [0, 1, 1, 0]
# example = [[0.8, 0.8],[0.2, 0.2]]
example = [[0, 0],[1, 0]]
example_label = [0, 1]

clf = svm.SVC()
clf.fit(data,label)

result = clf.predict(example)
print("예측결과 :",result)

score = metrics.accuracy_score(example_label,result)
print("정확도 :",score)
