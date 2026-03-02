# 🏙️ CivicQuest Seoul

> **Transforming Urban Issues into Collectible Monsters for a Safer Seoul.** > *A Gamified Civic Engagement Platform built for Gemini 3 Seoul Hackathon*
> 

---

## 🌟 개요 (Overview)

서울의 파손된 보도블록, 고장난 가로등 같은 부서진 공공시설물들은 도시의 인상을 해칠 뿐만 아니라 시민의 안전을 위협합니다. 하지만 기존의 민원 신고 프로세스는 복잡하고 지루하게 느껴져 시민들의 자발적인 참여를 이끌어내는 데 한계가 있습니다.

**CivicQuest Seoul**은 기존의 복잡하고 지루한 민원 프로세스를 '몬스터 수집'이라는 재미있는 퀘스트로 재정의합니다. Google Gemini의 최신 멀티모달 AI 제품군을 활용하여 도시의 결함을 가치 있는 시각적 자산으로 치환하고, 시민들이 즐겁게 참여하는 자발적 도시 안전망을 구축합니다.

## 🔑 Setup & Quick Start

본 프로젝트는 보안을 위해 API Key를 서버에 저장하지 않으며, 사용자의 브라우저 로컬 환경에서 안전하게 구동됩니다.

1. **Repository Clone & Install**
    
    ```bash
    git clone https://github.com/your-username/civicquest-seoul.git
    npm install
    npm run dev
    ```
    
2. **API Key 설정**
    - 앱 실행 후 **Settings**(하단 네비게이션 또는 설정 아이콘) 메뉴 진입
    - [Google AI Studio](https://aistudio.google.com/apikey)에서 발급받은 **Gemini API Key**를 입력
3. **Ready to Scan!** 
    - 이제 카메라로 서울의 문제를 촬영하고 몬스터를 수집하기

---

## 🤖 AI Models Architecture

각 파이프라인의 목적에 최적화된 Google의 최신 모델들을 활용합니다.

| **Purpose** | **Model** | **Description** |
| --- | --- | --- |
| **Analysis** | `gemini-2.5-flash` | 인프라 파손 분석 및 위험도/불편도 데이터 추출 |
| **Image Generation** | `gemini-2.5-flash-exp` | 3D 아트토이 스타일의 몬스터 이미지 생성 |
| **TTS (Monster Cry)** | `gemini-2.5-flash-preview-tts` | SSML 기반의 고유 몬스터 울음소리 합성 |

---

## 🛠 핵심 특징 (Core Features)

### 1. 🔍 AI Urban Vision Scanner

- **Real-time Capture:** 브라우저 카메라 및 Geolocation API 연동 제보 시스템
- **Multi-Label Classification:** 보도블록, 포트홀 등 **12종 이상의 시설물** 분류
- **Quality Control (Invalidation):** AI가 인프라 파손과 무관한 사진(예: 인물, 무관한 사물 등)을 자동으로 필터링하여 허위 신고 및 무의미한 몬스터 생성을 방지
- **Impact Scoring:** 파손 상태를 분석하여 '불편도'와 '위험도'를 $0 \sim 100$ 수치로 산출

### 2. 🧬 Deterministic Monster Engine

AI의 환각을 배제하고 게임 밸런스를 유지하기 위한 독자적 **Fixed Math Pipeline**을 적용합니다.

**[능력치 계산 공식]**

- **Impact Score:** $\text{ImpactScore} = \text{round}(0.55 \times \text{불편도} + 0.45 \times \text{위험도})$
- **Level:** $\text{Level} = 1 + \text{floor}(\text{ImpactScore} / 10) \quad (1 \sim 11)$
- **Final Stats:**
  - $\text{HP} = \text{round}((60 + 2.0 \times \text{불편도} + 1.6 \times \text{위험도}) \times \text{Multiplier})$
  - $\text{Multiplier} = 1.0 + (\text{Level} - 1) \times 0.08$
    

### 3. 🎨 Creative Generative Synthesis

- **Object-Preserving Art:** 원본 사물의 형태와 **파손 흔적(균열, 녹)**을 유지한 채 3D 캐릭터로 변환
- **Consistent Style Anchor:** 모든 몬스터가 일관된 '2020s NFT 아트토이' 스타일을 유지하도록 앵커 기술 적용

### 4. 🗃️ Local Persistence & Data Storage

서버 없이도 완벽한 영속성을 제공하여 개인정보와 API 비용을 보호합니다.

- **Monster Records:** `localforage`를 통한 IndexedDB 기반 데이터 관리
- **Media Storage:** 이미지 및 오디오 데이터를 Blob 형태로 변환하여 브라우저 IndexedDB에 영구 저장 (Safari 호환성 보장)
- **Client-Side Only:** 별도의 서버 없이 모든 API 호출은 브라우저에서 안전하게 직접 처리됨

### 5. 🎖️ Civic Feedback & Resolution System

단순히 인프라 문제를 신고하는 것에 그치지 않고, 시민들이 **자신이 발견한 문제가 해결되는 과정을 통해 실질적인 뿌듯함과 효능감**을 느낄 수 있도록 피드백 루프를 제공합니다.

- **Resolution Status Badge:** 몬스터 도감(Monster Dex)에서 내가 수집한 문제가 서울시에 의해 수리되었는지 "미해결 / 서울시에서 해결 완료" 배지로 직관적인 상태 확인이 가능합니다.
- **AI Restoration Preview:** 수리가 완료된 인프라의 "1개월 후" 모습을 AI가 생성하여 원본 구도와 배경 그대로 시각화합니다. 기울어진 볼라드나 깨진 바닥이 완벽하게 새것처럼 복원된 이미지를 나란히 배치하여, 나의 제보가 도시를 어떻게 바꾸었는지 한눈에 체감하게 합니다.

---

## 🎨 UI/UX Design System

- **Morning Yellow (#FF9919):** **2026 올해의 서울색**을 메인 컬러로 채택하여 활기찬 서울의 아침을 상징
- **Gaming UI:** `shadcn/ui`의 정갈함과 3D 렌더링 스타일의 화려한 인터랙션 결합

---

## ⚠️ Limitations

- API Key는 브라우저의 `localStorage`에 저장되므로 보안에 유의해야 합니다.
- 위치 정보 수집을 위해 HTTPS 환경 혹은 localhost 접근이 필요합니다.
- TTS 및 이미지 생성 품질은 입력된 데이터와 모델 상태에 따라 다를 수 있습니다.
