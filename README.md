# AI Navi Chatbot Widget

A lightweight, customizable chatbot widget that can be easily embedded into any website.

## Features

- 🎨 Customizable colors and styling
- 📱 Responsive design (mobile-friendly)
- 🎯 Configurable positioning (left/right)
- ⚡ Lightweight and fast loading
- 🔧 Easy integration

## Installation

1. Include the widget script in your HTML:

```html
<script src="src/chatbot-widget.js"></script>
```

## Usage

### Basic Usage

The widget will automatically initialize with default settings:

```html
<script src="src/chatbot-widget.js"></script>
```

### Custom Configuration

```html
<script>
window.chatbotWidgetOptions = {
    title: '🤖 My AI Assistant',
    primaryColor: '#ff6b35',
    secondaryColor: '#f7931e',
    chatbotUrl: 'https://your-chatbot-url.com',
    position: 'right' // 'left' or 'right'
};
</script>
<script src="src/chatbot-widget.js"></script>
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `title` | string | '🤖 AI 어시스턴트' | Widget title displayed in header |
| `primaryColor` | string | '#ff6b35' | Primary color for gradients |
| `secondaryColor` | string | '#f7931e' | Secondary color for gradients |
| `chatbotUrl` | string | 'https://develop.dqrr6detrv39g.amplifyapp.com/' | URL of your chatbot application |
| `position` | string | 'right' | Position of trigger button ('left' or 'right') |

## Development

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development Server

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview

```bash
npm run preview
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is private and proprietary.