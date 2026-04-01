(function () {
    'use strict';

    // ウィジェットが既にロードされているか確認
    if (window.ChatbotWidget) {
        return;
    }

    class ChatbotWidget {
        constructor(options = {}) {
            // デフォルト設定
            this.config = {
                title: options.title || '🤖 AI Navi',
                primaryColor: options.primaryColor || '#ff6b35',
                secondaryColor: options.secondaryColor || '#f7931e',
                chatbotUrl: options.chatbotUrl || 'https://ainavi-dev.meeta.jp/',
                position: options.position || 'right', // 'left' or 'right'
                showTriggerButton: options.showTriggerButton !== false, // デフォルトはtrue
                clientId: options.clientId || 'RS000001', // クライアントID
                appId: options.appId || '0001', // アプリID
                ...options
            };

            this.isOpen = false;
            this.triggerButton = null;
            this.modal = null;
            this.overlay = null;
            this.iframe = null;
            this.isMobile = this.checkMobile(); // モバイル環境チェック

            this.init();
        }

        // モバイル環境検出
        checkMobile() {
            const userAgent = navigator.userAgent || navigator.vendor || window.opera;
            // スマートフォン検出（タブレット除外）
            const isSmartphone = /iPhone|iPod|Android.*Mobile/i.test(userAgent);
            // 画面サイズでもチェック（スマートフォン基準）
            const isSmallScreen = window.innerWidth <= 480;
            return isSmartphone || isSmallScreen;
        }

        init() {
            // DOMがロードされた後にウィジェット作成
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.createWidget());
            } else {
                this.createWidget();
            }
        }

        createWidget() {
            this.createStyles();
            if (this.config.showTriggerButton) {
                this.createTriggerButton();
            }
            this.createModal();
            this.bindEvents();

            // iframe事前ロード開始
            this.preloadIframe();
        }

        createStyles() {
            const style = document.createElement('style');
            style.textContent = `
                .chatbot-widget * {
                    box-sizing: border-box;
                }

                /* PC용 트리거 버튼 - Figma 디자인 */
                .chatbot-trigger {
                    position: fixed;
                    bottom: 24px;
                    ${this.config.position}: 24px;
                    display: inline-flex;
                    height: 60px;
                    align-items: center;
                    gap: 12px;
                    padding: 0 24px;
                    flex-shrink: 0;
                    box-shadow: 1.5px 3px 3px 0 rgba(0, 0, 0, 0.25);
                    border-radius: 22.5px;
                    background: linear-gradient(135deg, ${this.config.primaryColor} 0%, ${this.config.secondaryColor} 100%);
                    border: none;
                    cursor: pointer;
                    z-index: 9998;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    overflow: hidden;
                    font-family: "Noto Sans", -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                
                /* PC 트리거 버튼 텍스트 */
                .chatbot-trigger-text {
                    color: #FFF;
                    font-size: 21px;
                    font-style: normal;
                    font-weight: 600;
                    line-height: 30px;
                    letter-spacing: 0.6px;
                    white-space: nowrap;
                }

                /* 모바일 스마트폰용 트리거 버튼 스타일 */
                .chatbot-trigger.mobile-trigger {
                    width: 80px;
                    height: 80px;
                    padding: 0;
                    gap: 8px;
                    border-radius: 100px;
                    background: linear-gradient(135deg, ${this.config.primaryColor} 0%, ${this.config.secondaryColor} 100%);
                    box-shadow: 2px 4px 4px 0 rgba(0, 0, 0, 0.25);
                    justify-content: center;
                }
                
                .chatbot-trigger.mobile-trigger .chatbot-trigger-text {
                    display: none;
                }

                .chatbot-trigger.mobile-trigger:hover {
                    transform: none;
                    box-shadow: 2px 4px 4px 0 rgba(0, 0, 0, 0.25);
                    background: linear-gradient(135deg, ${this.config.primaryColor} 0%, ${this.config.secondaryColor} 100%);
                }

                .chatbot-trigger.mobile-trigger .chatbot-trigger-icon {
                    width: 24px;
                    height: 24px;
                    flex-shrink: 0;
                }

                .chatbot-trigger:hover {
                    transform: translateY(-2px);
                    box-shadow: 2px 4px 8px rgba(0, 0, 0, 0.3);
                    background: linear-gradient(135deg, ${this.darkenColor(this.config.primaryColor, 10)} 0%, ${this.darkenColor(this.config.secondaryColor, 10)} 100%);
                }

                .chatbot-trigger:active {
                    transform: scale(0.95);
                }

                .chatbot-trigger-icon {
                    width: 24px;
                    height: 24px;
                    flex-shrink: 0;
                    transition: transform 0.3s ease;
                }

                .chatbot-trigger.open .chatbot-trigger-icon {
                    transform: rotate(180deg);
                }

                .chatbot-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: transparent; /* 투명 배경으로 변경 */
                    z-index: 9999;
                    opacity: 1; /* 항상 투명하게 유지 */
                    visibility: hidden;
                    transition: visibility 0.3s ease;
                    pointer-events: none; /* 클릭 이벤트 차단 */
                }

                .chatbot-overlay.open {
                    visibility: visible;
                }

                .chatbot-modal {
                    position: fixed;
                    top: 0;
                    bottom: 0;
                    ${this.config.position === 'left' ? 'left' : 'right'}: 0;
                    width: 500px;
                    height: 100%;
                    background: white;
                    border-radius: 0;
                    box-shadow: ${this.config.position === 'left' ? '10px' : '-10px'} 0 50px rgba(0, 0, 0, 0.3);
                    z-index: 10001; /* z-index 최적화 */
                    transform: translateX(${this.config.position === 'left' ? '-100%' : '100%'});
                    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    pointer-events: auto; /* 모달은 클릭 가능 */
                }

                .chatbot-modal.open {
                    transform: translateX(0);
                }

                .chatbot-header {
                    background: white;
                    color: #333;
                    border-bottom: 1px solid #e0e0e0;
                    padding: 8px 16px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-shrink: 0;
                    min-height: 36px;
                }
                
                /* 헤더 버튼 그룹 */
                .chatbot-header-buttons {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .chatbot-title {
                    font-size: 14px;
                    font-weight: 600;
                    margin: 0;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    line-height: 1.1;
                }

                /* 리셋 버튼 스타일 */
                .chatbot-reset {
                    background: none;
                    border: none;
                    color: #B7B7B7;
                    cursor: pointer;
                    padding: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    flex-shrink: 0;
                }
                
                .chatbot-reset:hover {
                    background-color: rgba(0, 0, 0, 0.05);
                    color: #666;
                }
                
                .chatbot-reset:active {
                    transform: scale(0.95);
                    color: #333;
                }
                
                .chatbot-reset svg {
                    width: 24px;
                    height: 24px;
                    flex-shrink: 0;
                }

                .chatbot-close {
                    background: none;
                    border: none;
                    color: #B7B7B7;
                    cursor: pointer;
                    padding: 0;
                    border-radius: 0;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 24px;
                    height: 24px;
                    flex-shrink: 0;
                    opacity: 1;
                }

                .chatbot-close:hover {
                    color: #999;
                    transform: scale(1.05);
                }

                .chatbot-close:active {
                    transform: scale(0.95);
                    color: #666;
                }

                .chatbot-close-icon {
                    width: 24px;
                    height: 24px;
                    fill: currentColor;
                    stroke: none;
                    flex-shrink: 0;
                }

                .chatbot-content {
                    flex: 1;
                    overflow: hidden;
                    border-radius: 0;
                }

                .chatbot-iframe {
                    width: 100%;
                    height: 100%;
                    border: none;
                    background: #f8f9fa;
                    border-radius: 0;
                }

                .chatbot-loading {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    color: #666;
                }

                .chatbot-spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid #f3f3f3;
                    border-top: 3px solid ${this.config.primaryColor};
                    border-radius: 50%;
                    animation: chatbot-spin 1s linear infinite;
                    margin-right: 12px;
                }

                @keyframes chatbot-spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                /* 모바일 반응형 */
                @media (max-width: 768px) {
                    .chatbot-modal {
                        width: 100%;
                        top: 10%;
                        height: 90%;
                        border-radius: 0;
                        ${this.config.position}: 0;
                        transform: translateY(100%);
                    }
                    
                    .chatbot-modal.open {
                        transform: translateY(0);
                    }
                    
                    .chatbot-trigger {
                        bottom: 20px;
                        ${this.config.position}: 20px;
                        width: 56px;
                        height: 56px;
                    }
                    
                    .chatbot-trigger-icon {
                        width: 24px;
                        height: 24px;
                    }

                    .chatbot-header {
                        padding: 6px 12px;
                        min-height: 32px;
                    }

                    .chatbot-title {
                        font-size: 13px;
                    }
                }

                @media (max-width: 480px) {
                    .chatbot-modal {
                        top: 0;
                        height: 100%;
                        border-radius: 0;
                    }
                    
                    .chatbot-content {
                        border-radius: 0;
                    }
                    
                    .chatbot-iframe {
                        border-radius: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        createTriggerButton() {
            this.triggerButton = document.createElement('button');
            this.triggerButton.className = this.isMobile ? 'chatbot-trigger mobile-trigger' : 'chatbot-trigger';

            // モバイル用アイコン
            if (this.isMobile) {
                this.triggerButton.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="27" height="27" viewBox="0 0 27 27" fill="none">
                        <path d="M13.5 1.7002C13.8038 1.7002 14.0498 1.94624 14.0498 2.25V5.625C14.0496 5.92857 13.8036 6.1748 13.5 6.1748C13.1964 6.1748 12.9504 5.92857 12.9502 5.625V2.7998H9C8.69638 2.7998 8.45042 2.55357 8.4502 2.25C8.4502 1.94624 8.69624 1.7002 9 1.7002H13.5Z" fill="white"/>
                        <path d="M20.25 6.25C20.9793 6.25 21.6786 6.53994 22.1943 7.05566C22.7101 7.57139 23 8.27065 23 9V18C23 18.7293 22.7101 19.4286 22.1943 19.9443C21.6786 20.4601 20.9793 20.75 20.25 20.75H9.20703L4.85352 25.1035C4.71052 25.2465 4.49543 25.2893 4.30859 25.2119C4.12179 25.1345 4 24.9522 4 24.75V9C4 8.27065 4.28994 7.57139 4.80566 7.05566C5.32139 6.53994 6.02065 6.25 6.75 6.25H20.25Z" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M3.375 13.125C3.58211 13.125 3.75 13.2929 3.75 13.5C3.75 13.7071 3.58211 13.875 3.375 13.875H1.125C0.917893 13.875 0.75 13.7071 0.75 13.5C0.75 13.2929 0.917893 13.125 1.125 13.125H3.375Z" stroke="white" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M9.75 14.625V12.375C9.75 12.1679 9.91789 12 10.125 12C10.3321 12 10.5 12.1679 10.5 12.375V14.625C10.5 14.8321 10.3321 15 10.125 15C9.91789 15 9.75 14.8321 9.75 14.625Z" stroke="white" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M16.5 14.625V12.375C16.5 12.1679 16.6679 12 16.875 12C17.0821 12 17.25 12.1679 17.25 12.375V14.625C17.25 14.8321 17.0821 15 16.875 15C16.6679 15 16.5 14.8321 16.5 14.625Z" stroke="white" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M25.875 13.125C26.0821 13.125 26.25 13.2929 26.25 13.5C26.25 13.7071 26.0821 13.875 25.875 13.875H23.625C23.4179 13.875 23.25 13.7071 23.25 13.5C23.25 13.2929 23.4179 13.125 23.625 13.125H25.875Z" stroke="white" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round"/>
                     </svg>
                `;
            } else {
                // PC用Figmaデザインアイコン + テキスト
                this.triggerButton.innerHTML = `
                    <svg class="chatbot-trigger-icon" xmlns="http://www.w3.org/2000/svg" width="25" height="24" viewBox="0 0 25 24" fill="none">
                        <g clip-path="url(#clip0_870_3324)">
                            <path d="M12.4995 1.17432C12.9551 1.17432 13.3246 1.54394 13.3247 1.99951V4.99951C13.3247 5.45515 12.9551 5.82471 12.4995 5.82471C12.0441 5.82446 11.6743 5.45499 11.6743 4.99951V2.82471H8.49951C8.04409 2.82446 7.67432 2.45499 7.67432 1.99951C7.67439 1.54409 8.04413 1.17456 8.49951 1.17432H12.4995Z" fill="white"/>
                            <path d="M18.5 5.25C19.2293 5.25 19.9286 5.53994 20.4443 6.05566C20.9601 6.57139 21.25 7.27065 21.25 8V16C21.25 16.7293 20.9601 17.4286 20.4443 17.9443C19.9286 18.4601 19.2293 18.75 18.5 18.75H8.81055L5.03027 22.5303C4.81579 22.7448 4.49313 22.8094 4.21289 22.6934C3.93263 22.5773 3.75 22.3033 3.75 22V8C3.75 7.27065 4.03994 6.57139 4.55566 6.05566C5.07139 5.53994 5.77065 5.25 6.5 5.25H18.5Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M3.5 11.4375C3.81066 11.4375 4.0625 11.6893 4.0625 12C4.0625 12.3107 3.81066 12.5625 3.5 12.5625H1.5C1.18934 12.5625 0.9375 12.3107 0.9375 12C0.9375 11.6893 1.18934 11.4375 1.5 11.4375H3.5Z" stroke="white" stroke-width="1.125" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M8.9375 13V11C8.9375 10.6893 9.18934 10.4375 9.5 10.4375C9.81066 10.4375 10.0625 10.6893 10.0625 11V13C10.0625 13.3107 9.81066 13.5625 9.5 13.5625C9.18934 13.5625 8.9375 13.3107 8.9375 13Z" stroke="white" stroke-width="1.125" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M14.9375 13V11C14.9375 10.6893 15.1893 10.4375 15.5 10.4375C15.8107 10.4375 16.0625 10.6893 16.0625 11V13C16.0625 13.3107 15.8107 13.5625 15.5 13.5625C15.1893 13.5625 14.9375 13.3107 14.9375 13Z" stroke="white" stroke-width="1.125" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M23.5 11.4375L23.6133 11.4492C23.8696 11.5017 24.0625 11.7282 24.0625 12C24.0625 12.2718 23.8696 12.4983 23.6133 12.5508L23.5 12.5625H21.5C21.1893 12.5625 20.9375 12.3107 20.9375 12C20.9375 11.6893 21.1893 11.4375 21.5 11.4375H23.5Z" stroke="white" stroke-width="1.125" stroke-linecap="round" stroke-linejoin="round"/>
                        </g>
                        <defs>
                            <clipPath id="clip0_870_3324">
                                <rect width="24" height="24" fill="white" transform="translate(0.5)"/>
                            </clipPath>
                        </defs>
                    </svg>
                    <span class="chatbot-trigger-text">AIチャットサポート</span>
                `;
            }

            this.triggerButton.setAttribute('aria-label', 'チャットボットを開く');
            document.body.appendChild(this.triggerButton);
        }

        createModal() {
            // オーバーレイ作成
            this.overlay = document.createElement('div');
            this.overlay.className = 'chatbot-overlay';

            // モーダル作成
            this.modal = document.createElement('div');
            this.modal.className = 'chatbot-modal';

            // 헤더 생성
            const header = document.createElement('div');
            header.className = 'chatbot-header';
            header.innerHTML = `
                <h3 class="chatbot-title">${this.config.title}</h3>
                <div class="chatbot-header-buttons">
                    <button class="chatbot-reset" aria-label="最初に戻る" title="最初に戻る">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M18.7412 3.9248V7.42773C18.7408 7.77572 18.6025 8.10938 18.3564 8.35547C18.1411 8.57077 17.859 8.70424 17.5586 8.73438L17.4287 8.74121H13.9248V7.25781H16.5762C15.523 6.24174 14.1608 5.60253 12.7021 5.44629C11.183 5.28358 9.65443 5.65382 8.37793 6.49316C7.10156 7.33245 6.1565 8.58898 5.7041 10.0479C5.25173 11.5069 5.32058 13.0781 5.89844 14.4922C6.47631 15.9062 7.52728 17.0759 8.87207 17.8008C10.2167 18.5255 11.7715 18.7612 13.2705 18.4668C14.7696 18.1723 16.1203 17.3661 17.0908 16.1865C18.0613 15.0069 18.5919 13.5264 18.5918 11.999V11.9238H20.0752V11.999C20.0757 13.8476 19.4418 15.6407 18.2793 17.0781C17.1167 18.5156 15.4956 19.5102 13.6875 19.8965C11.8793 20.2828 9.99344 20.0371 8.34473 19.2002C6.696 18.3633 5.38407 16.9863 4.62891 15.2988C3.87376 13.6113 3.72069 11.7155 4.19531 9.92871C4.66997 8.14204 5.74427 6.57286 7.2373 5.48242C8.73026 4.39207 10.5519 3.84629 12.3984 3.9375C14.1903 4.02611 15.8998 4.70967 17.2588 5.87598V3.9248H18.7412Z" fill="currentColor" stroke="currentColor" stroke-width="0.15"/>
                        </svg>
                    </button>
                    <button class="chatbot-close" aria-label="チャットボットを閉じる" title="チャットボットを閉じる">
                        <svg class="chatbot-close-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M4.99422 3.90637C4.73832 3.90637 4.47072 3.99238 4.27542 4.18738C3.88492 4.57838 3.88492 5.23437 4.27542 5.62537L10.5567 11.9064L4.27542 18.1874C3.88492 18.5784 3.88492 19.2344 4.27542 19.6254C4.66602 20.0154 5.32242 20.0154 5.71302 19.6254L11.9942 13.3444L18.2754 19.6254C18.666 20.0154 19.3224 20.0154 19.713 19.6254C20.1035 19.2344 20.1035 18.5784 19.713 18.1874L13.4317 11.9064L19.713 5.62537C20.1035 5.23437 20.1035 4.57838 19.713 4.18738C19.5177 3.99238 19.25 3.90637 18.9942 3.90637C18.7383 3.90637 18.4708 3.99238 18.2754 4.18738L11.9942 10.4684L5.71302 4.18738C5.51772 3.99238 5.25012 3.90637 4.99422 3.90637Z" fill="currentColor"/>
                        </svg>
                    </button>
                </div>
            `;

            // コンテンツエリア作成
            const content = document.createElement('div');
            content.className = 'chatbot-content';
            content.innerHTML = `
                <div class="chatbot-loading">
                    <div class="chatbot-spinner"></div>
                    チャットボットを読み込み中です...
                </div>
            `;

            this.modal.appendChild(header);
            this.modal.appendChild(content);
            document.body.appendChild(this.overlay);
            document.body.appendChild(this.modal);
        }

        bindEvents() {
            // トリガーボタンクリック（ボタンがある場合のみ）
            if (this.triggerButton) {
                this.triggerButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.toggleModal();
                });
            }

            // オーバーレイクリックで閉じる - 削除済み
            // this.overlay.addEventListener('click', () => {
            //     this.closeModal();
            // });

            // 리셋 버튼 클릭
            const resetButton = this.modal.querySelector('.chatbot-reset');
            resetButton.addEventListener('click', () => {
                this.resetChatbot();
            });

            // 닫기 버튼 클릭
            const closeButton = this.modal.querySelector('.chatbot-close');
            closeButton.addEventListener('click', () => {
                this.closeModal();
            });

            // ESCキーで閉じる - 削除済み（閉じるボタンのみ使用）
            // document.addEventListener('keydown', (e) => {
            //     if (e.key === 'Escape' && this.isOpen) {
            //         this.closeModal();
            //     }
            // });

            // モーダル内部クリック時のイベント伝播防止
            this.modal.addEventListener('click', (e) => {
                e.stopPropagation();
            });

            // リンククリックでモーダルを開く
            this.bindLinkTriggers();
        }

        preloadIframe() {
            // URLにクエリパラメータを追加
            const url = new URL(this.config.chatbotUrl);
            url.searchParams.set('clientId', this.config.clientId);
            url.searchParams.set('appId', this.config.appId);

            // 隠しiframeを事前に作成してロード開始
            this.iframe = document.createElement('iframe');
            this.iframe.className = 'chatbot-iframe';
            this.iframe.src = url.toString();
            this.iframe.setAttribute('allow', 'microphone; camera');
            this.iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox');
            this.iframe.style.display = 'none';

            // 事前ロード完了表示
            this.iframe.onload = () => {
                this.isIframePreloaded = true;
            };

            // iframe의 READY 메시지를 수신하여 INITIAL_DATA 응답
            this.setupPostMessageHandler();

            // bodyに隠した状態で追加して事前ロード
            document.body.appendChild(this.iframe);
        }

        // iframe과의 postMessage 통신 설정
        setupPostMessageHandler() {
            this.messageHandler = (event) => {
                let message;
                if (typeof event.data === 'string') {
                    try {
                        message = JSON.parse(event.data);
                    } catch {
                        return;
                    }
                } else {
                    message = event.data;
                }

                // iframe에서 READY 메시지를 받으면 INITIAL_DATA 응답
                if (message && message.type === 'READY') {
                    this.sendInitialData();
                }
            };

            window.addEventListener('message', this.messageHandler);
        }

        // iframe에 INITIAL_DATA 전송
        sendInitialData() {
            if (!this.iframe || !this.iframe.contentWindow) return;

            const initialData = {
                type: 'INITIAL_DATA',
                payload: {
                    clientId: this.config.clientId,
                    appId: this.config.appId
                }
            };

            this.iframe.contentWindow.postMessage(initialData, '*');
            console.log('INITIAL_DATA sent to iframe:', initialData.payload);
        }

        bindLinkTriggers() {
            // 既存リンクにイベントバインディング
            this.attachLinkEvents();

            // DOM変更を検出して新しいリンクにも自動バインディング
            this.linkObserver = new MutationObserver(() => {
                this.attachLinkEvents();
            });

            this.linkObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
        }

        attachLinkEvents() {
            // data-chatbot-trigger属性を持つすべての要素
            const triggers = document.querySelectorAll('[data-chatbot-trigger]');

            triggers.forEach(trigger => {
                // 既にイベントがバインディングされた要素はスキップ
                if (trigger.hasAttribute('data-chatbot-bound')) return;

                trigger.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.openModal();
                });

                // バインディング完了表示
                trigger.setAttribute('data-chatbot-bound', 'true');
            });

            // クラスベースのトリガー
            const classTriggers = document.querySelectorAll('.chatbot-trigger-link');

            classTriggers.forEach(trigger => {
                if (trigger.hasAttribute('data-chatbot-bound')) return;

                trigger.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.openModal();
                });

                trigger.setAttribute('data-chatbot-bound', 'true');
            });
        }

        toggleModal() {
            if (this.isOpen) {
                this.closeModal();
            } else {
                this.openModal();
            }
        }

        openModal() {
            this.isOpen = true;
            if (this.triggerButton) {
                this.triggerButton.classList.add('open');
            }
            this.overlay.classList.add('open');
            this.modal.classList.add('open');
            // document.body.style.overflow = 'hidden'; // Bodyスクロールロック削除

            // 事前ロードされたiframeを使用または新規ロード
            if (this.iframe && this.isIframePreloaded) {
                this.showPreloadedIframe();
            } else {
                this.loadChatbot();
            }
        }

        closeModal() {
            this.isOpen = false;
            if (this.triggerButton) {
                this.triggerButton.classList.remove('open');
            }
            this.overlay.classList.remove('open');
            this.modal.classList.remove('open');
            // document.body.style.overflow = ''; // Bodyスクロールロック解除削除
        }
        
        // 챗봇 리셋 기능
        resetChatbot() {
            if (this.iframe && this.iframe.src) {
                // iframe 새로고침 (확인 없이 바로 실행)
                const currentSrc = this.iframe.src;
                this.iframe.src = 'about:blank';
                setTimeout(() => {
                    this.iframe.src = currentSrc;
                }, 100);
            }
        }

        showPreloadedIframe() {
            const content = this.modal.querySelector('.chatbot-content');
            const loading = content.querySelector('.chatbot-loading');

            if (loading) {
                loading.style.opacity = '0';
                setTimeout(() => {
                    if (loading.parentNode) {
                        content.removeChild(loading);
                    }

                    // 事前ロードされたiframeをモーダルに移動
                    this.iframe.style.display = 'block';
                    this.iframe.style.opacity = '0';
                    content.appendChild(this.iframe);

                    setTimeout(() => {
                        this.iframe.style.transition = 'opacity 0.3s ease';
                        this.iframe.style.opacity = '1';
                    }, 50);
                }, 200);
            }
        }

        loadChatbot() {
            const content = this.modal.querySelector('.chatbot-content');
            let isLoaded = false;

            // iframe作成（まだない場合のみ）
            if (!this.iframe) {
                this.iframe = document.createElement('iframe');
                this.iframe.className = 'chatbot-iframe';
                this.iframe.src = this.config.chatbotUrl;
                this.iframe.setAttribute('allow', 'microphone; camera');
                this.iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox');
            }

            const showIframe = () => {
                if (isLoaded) return;
                isLoaded = true;

                const loading = content.querySelector('.chatbot-loading');
                if (loading) {
                    loading.style.opacity = '0';
                    setTimeout(() => {
                        if (loading.parentNode) {
                            content.removeChild(loading);
                        }
                        content.appendChild(this.iframe);
                        this.iframe.style.opacity = '0';
                        setTimeout(() => {
                            this.iframe.style.transition = 'opacity 0.3s ease';
                            this.iframe.style.opacity = '1';
                        }, 50);
                    }, 300);
                }
            };

            // ロード完了後ロード画面削除
            this.iframe.onload = () => {
                console.log('iframe loaded successfully');
                showIframe();
            };

            // タイムアウトで強制ロード完了（3秒後）
            setTimeout(() => {
                if (!isLoaded) {
                    showIframe();
                }
            }, 3000);

            // エラー処理
            this.iframe.onerror = () => {
                content.innerHTML = `
                    <div class="chatbot-loading">
                        <div style="text-align: center; padding: 40px;">
                            <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
                            <div style="font-size: 16px; color: #666; margin-bottom: 8px;">チャットボットを読み込めません</div>
                            <div style="font-size: 14px; color: #999;">ネットワーク接続を確認してください</div>
                        </div>
                    </div>
                `;
            };
        }

        // ユーティリティ関数
        hexToRgba(hex, alpha) {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }

        darkenColor(hex, percent) {
            const num = parseInt(hex.replace("#", ""), 16);
            const amt = Math.round(2.55 * percent);
            const R = (num >> 16) - amt;
            const G = (num >> 8 & 0x00FF) - amt;
            const B = (num & 0x0000FF) - amt;
            return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
                (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
                (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
        }
    }

    // グローバルオブジェクトに登録
    window.ChatbotWidget = ChatbotWidget;

    // 自動初期化 
    // DOMが完全にロードされた後に初期化してwindow.chatbotWidgetOptionsを確認
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (!window.chatbotWidgetInstance) {
                if (window.chatbotWidgetOptions) {
                    window.chatbotWidgetInstance = new ChatbotWidget(window.chatbotWidgetOptions);
                } else {
                    window.chatbotWidgetInstance = new ChatbotWidget();
                }
            }
        });
    } else {
        if (!window.chatbotWidgetInstance) {
            if (window.chatbotWidgetOptions) {
                window.chatbotWidgetInstance = new ChatbotWidget(window.chatbotWidgetOptions);
            } else {
                window.chatbotWidgetInstance = new ChatbotWidget();
            }
        }
    }
})();