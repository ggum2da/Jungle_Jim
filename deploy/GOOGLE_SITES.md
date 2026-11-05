# Google Sites에 게임 넣기

게임 호스팅: GitHub Pages. 안내 페이지: Google Sites. Google Sites 자체에는 npm 프로젝트를 업로드하지 않습니다.

## 먼저 게임 배포 확인

1. GitHub 저장소 `ggum2da/Jungle_Jim`의 Settings → Pages로 이동합니다.
2. Build and deployment → Source에서 **GitHub Actions**를 선택합니다.
3. Actions → Deploy game to GitHub Pages → Run workflow → main → Run workflow를 실행합니다. 이미 성공한 배포가 있으면 다시 실행하지 않아도 됩니다.
4. 배포가 성공한 뒤 `https://ggum2da.github.io/Jungle_Jim/`에 접속하여 작전 시작 버튼이 보이는지 확인합니다. 배포 성공 전에는 이 주소가 동작하지 않을 수 있습니다.

## Google Sites 편집

1. 원하는 Google Sites 사이트를 편집 모드로 엽니다.
2. 오른쪽 **삽입 → 임베드 → URL**에 게임 주소를 넣습니다. 미리보기가 나오면 **삽입**을 누릅니다.
3. 삽입된 영역을 넓히고 충분한 높이(PC 약 720px, 폰 약 800px)를 확보합니다.
4. 영역 아래에 **버튼**을 추가합니다. 이름은 `새 창에서 게임하기`, 링크는 게임 주소를 입력합니다. 폰에서는 새 창에서 실행하는 편이 조작하기 편합니다.
5. URL 삽입이 원하는 형태로 표시되지 않으면 **삽입 → 임베드 → 코드 삽입**에 `google-sites-embed.html` 내용을 사용합니다.
6. Sites의 미리보기에서 PC와 폰 화면을 확인한 뒤 **게시**합니다. Google Sites 게시 권한과 공유 범위는 소유자가 설정해야 합니다.

## 확인 사항

- 사이트 내 키보드 조작은 먼저 게임 영역을 클릭해야 활성화됩니다.
- 외부 게임 주소와 Sites 삽입 영역은 브라우저 저장 공간이 다를 수 있습니다. 체크포인트는 기기/브라우저별로 저장되며 서버에 동기화하지 않습니다.
- 브라우저의 저장 제한으로 체크포인트 저장에 실패하면 게임에 경고가 표시됩니다. 새 창 실행을 이용하세요.
- 게임은 외부 API 키, 로그인, 광고 없이 동작합니다.
- GitHub Pages 사이트에 접근할 수 있는 사람은 게임을 열 수 있습니다. Google Sites의 접근 제한이 게임 주소 자체의 접근을 제한하지 않습니다.
