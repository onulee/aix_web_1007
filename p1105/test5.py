from PIL import Image
import numpy as np

# 1. 이미지 파일 불러오기
img = Image.open("p1105/data/six.jpg")

# 2. 흑백 이미지로 변환 (0~255)
img = img.convert("L")

# 3. 28×28 크기로 조정
img = img.resize((28, 28))

# 4. 이미지 데이터를 숫자 배열로 변환
data = np.array(img)

# 5. 색상 반전 (MNIST 형식으로 변환)
# 흰색 배경(255) → 검은색(0)
# 검은색 숫자(0) → 흰색(255)
data = 255 - data

# 6. 2차원 배열 출력 (28×28)
print("28×28 배열")
print(data)

# 7. 1차원 배열로 변환 (784개)
flat_data = data.flatten()

print("\n1차원 배열")
print(flat_data.tolist())

# 8. 텍스트 파일 저장
with open("six.txt", "w") as f:
    f.write(" ".join(map(str, flat_data)))

# 9. CSV 파일 저장
np.savetxt("six.csv", data, fmt="%d", delimiter=",")

print("\n변환 완료!")
print("데이터 개수:", len(flat_data))
print("최솟값:", flat_data.min())
print("최댓값:", flat_data.max())