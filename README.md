# AI Navi 챗봇 위젯

웹사이트에 쉽게 삽입할 수 있는 가벼우고 커스터마이징 가능한 챗봇 위젯입니다.

## 특징

- 🎨 색상 및 스타일 커스터마이징
- 📱 반응형 디자인 (모바일 친화적)
- 🎯 위치 설정 가능 (좌/우)
- ⚡ 가볍고 빠른 로딩
- 🔧 간편한 통합

## 설치

1. HTML에 위젯 스크립트를 포함시킵니다:

```html
<script src="src/chatbot-widget.js"></script>
```

## 사용법

### 기본 사용법

위젯은 기본 설정으로 자동 초기화됩니다:

```html
<script src="src/chatbot-widget.js"></script>
```

### 커스텀 설정

```html
<script>
window.chatbotWidgetOptions = {
    title: '🤖 나의 AI 어시스턴트',
    primaryColor: '#ff6b35',
    secondaryColor: '#f7931e',
    chatbotUrl: 'https://your-chatbot-url.com',
    position: 'right' // 'left' 또는 'right'
};
</script>
<script src="src/chatbot-widget.js"></script>
```

## 설정 옵션

| 옵션 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `title` | string | '🤖 AI 어시스턴트' | 헤더에 표시될 위젯 제목 |
| `primaryColor` | string | '#ff6b35' | 그라데이션 주 색상 |
| `secondaryColor` | string | '#f7931e' | 그라데이션 보조 색상 |
| `chatbotUrl` | string | 'https://develop.dqrr6detrv39g.amplifyapp.com/' | 챗봇 애플리케이션 URL |
| `position` | string | 'right' | 트리거 버튼 위치 ('left' 또는 'right') |
| `showTriggerButton` | boolean | true | 플로팅 트리거 버튼 표시/숨김 |

## 링크 트리거

페이지의 링크나 버튼을 사용해서도 챗봇 모달을 열 수 있습니다:

### 데이터 속성 사용:
```html
<a href="#" data-chatbot-trigger>문의하기</a>
<button data-chatbot-trigger>챗봇 열기</button>
```

### CSS 클래스 사용:
```html
<a href="#" class="chatbot-trigger-link">고객 지원</a>
<span class="chatbot-trigger-link">도움말</span>
```

### 프로그래밍 API:
```javascript
// 위젯 인스턴스 가져오기 (커스텀 옵션 사용 시)
const widget = new ChatbotWidget();

// 모달 열기
widget.openModal();

// 모달 닫기
widget.closeModal();

// 모달 토글
widget.toggleModal();
```

## 링크 전용 모드

플로팅 트리거 버튼을 숨기고 링크만으로 챗봇을 사용할 수 있습니다:

```html
<script>
window.chatbotWidgetOptions = {
    title: '고객 지원',
    showTriggerButton: false  // 플로팅 버튼 숨기기
};
</script>
<script src="https://your-amplify-url.com/chatbot-widget.iife.js"></script>

<!-- 링크로 챗봇 열기 -->
<a href="#" data-chatbot-trigger>문의하기</a>
<button class="chatbot-trigger-link">고객 지원</button>
```

완전한 예시는 `link-only-sample.html`을 참조하세요.

## 개발

### 필수 요구사항

- Node.js (버전 14 이상)
- npm 또는 yarn

### 설정

1. 저장소 클론
2. 의존성 설치:
   ```bash
   npm install
   ```

### 개발 서버

```bash
npm run dev
```

### 빌드

```bash
npm run build
```

### 미리보기

```bash
npm run preview
```

## 브라우저 지원

- Chrome (최신)
- Firefox (최신)
- Safari (최신)
- Edge (최신)

## 라이선스

이 프로젝트는 비공개 및 독점 소유입니다.