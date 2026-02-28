# 🏙️ CivicQuest Seoul

> **Transforming Urban Issues into Collectible Monsters for a Safer Seoul.** > *A Gamified Civic Engagement Platform built for Gemini 3 Seoul Hackathon*
> 

---

## 🌟 개요 (Overview)

서울의 파손된 보도블록, 고장난 가로등 같은 부서진 공공시설물들은 도시의 인상을 해칠 뿐만 아니라 시민의 안전을 위협합니다. 하지만 기존의 민원 신고 프로세스는 복잡하고 지루하게 느껴져 시민들의 자발적인 참여를 이끌어내는 데 한계가 있었습니다

**CivicQuest Seoul**은 기존의 복잡하고 지루한 민원 프로세스를 '몬스터 수집'이라는 재미있는 퀘스트로 재정의합니다. Google Gemini의 최신 멀티모달 AI 제품군을 활용하여 도시의 결함을 가치 있는 시각적 자산으로 치환하고, 시민들이 즐겁게 참여하는 자발적 도시 안전망을 구축합니다.

## 🔑 Setup & Quick Start

본 프로젝트는 보안을 위해 API Key를 서버에 저장하지 않으며, 사용자의 브라우저 로컬 환경에서 안전하게 구동됩니다.

1. **Repository Clone & Install**Bash
    
    `git clone https://github.com/your-username/civicquest-seoul.git
    npm install
    npm run dev`
    
2. **API Key 설정**
    - 앱 실행 후 **Settings**(하단 네비게이션 또는 설정 아이콘) 메뉴 진입.
    - [Google AI Studio](https://aistudio.google.com/apikey)에서 발급받은 **Gemini API Key**를 입력.
3. **Ready to Scan!** 이제 카메라로 서울의 문제를 촬영하고 몬스터를 수집하세요.

---

## 🤖 AI Models Architecture

각 파이프라인의 목적에 최적화된 Google의 최신 모델들을 활용합니다.

| **Purpose** | **Model** | **Description** |
| --- | --- | --- |
| **Analysis** | `gemini-2.5-flash` | 인프라 파손 분석 및 위험도/불편도 데이터 추출 |
| **Image Generation** | `gemini-2.0-flash-exp` | 3D 아트토이 스타일의 몬스터 이미지 생성 |
| **TTS (Monster Cry)** | `gemini-2.5-flash-preview-tts` | SSML 기반의 고유 몬스터 울음소리 합성 |

---

## 🛠 핵심 특징 (Core Features)

### 1. 🔍 AI Urban Vision Scanner

- **Real-time Capture:** 브라우저 카메라 및 Geolocation API 연동 제보 시스템.
- **Multi-Label Classification:** 보도블록, 포트홀 등 **12종 이상의 시설물** 분류.
- **Impact Scoring:** 파손 상태를 분석하여 '불편도'와 '위험도'를 $0$~$100$ 수치로 산출.

### 2. 🧬 Deterministic Monster Engine

AI의 환각을 배제하고 게임 밸런스를 유지하기 위한 독자적 **Fixed Math Pipeline**을 적용합니다.

**[능력치 계산 공식]**

- **Impact Score:** $ImpactScore = round(0.55 \times 불편도 + 0.45 \times 위험도)$
- **Level:** $Level = 1 + floor(ImpactScore / 10) \quad (1 \sim 11)$
- **Final Stats:**
    
    $$HP = round((60 + 2.0 \times 불편도 + 1.6 \times 위험도) \times Multiplier)$$
    
    *(Multiplier = 1.0 + (Level - 1) * 0.08)*
    

### 3. 🎨 Creative Generative Synthesis

- **Object-Preserving Art:** 원본 사물의 형태와 **파손 흔적(균열, 녹)**을 유지한 채 3D 캐릭터로 변환.
- **Consistent Style Anchor:** 모든 몬스터가 일관된 '2020s NFT 아트토이' 스타일을 유지하도록 앵커 기술 적용.

### 4. 🗃️ Local Persistence & Data Storage

서버 없이도 완벽한 영속성을 제공하여 개인정보와 API 비용을 보호합니다.

- **Monster Records:** `localforage`를 통한 IndexedDB 기반 데이터 관리.
- **Media Storage:** 이미지 및 오디오 데이터를 Blob 형태로 IndexedDB에 영구 저장.
- **Client-Side Only:** 모든 API 호출은 Next.js Route Handlers를 통해 안전하게 처리됩니다.

---

## 🎨 UI/UX Design System

- **Morning Yellow (#FF9919):** **2026 올해의 서울색**을 메인 컬러로 채택하여 활기찬 서울의 아침을 상징.
- **Gaming UI:** `shadcn/ui`의 정갈함과 3D 렌더링 스타일의 화려한 인터랙션 결합.

---

## ⚠️ Limitations

- API Key는 브라우저의 `localStorage`에 저장되므로 보안에 유의해야 합니다.
- 위치 정보 수집을 위해 HTTPS 환경 혹은 localhost 접근이 필요합니다.
- TTS 및 이미지 생성 품질은 입력된 데이터와 모델 상태에 따라 다를 수 있습니다.
이 성격이 마음에 드시나요?
개발자 모드