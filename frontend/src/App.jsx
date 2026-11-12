import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import MainPage from "./pages/MainPage";
import InventoryPage from "./pages/InventoryPage";
import InventoryDetailPage from "./pages/InventoryDetailPage";
import BreakRoomPage from "./pages/BreakRoomPage";
import { endingBgmUrl } from "./services/endingMusic";
import RequestBoardList from "./pages/requestboard/RequestBoardList";
import RequestBoardDetail from "./pages/requestboard/RequestBoardDetail";
import RequestBoardEdit from "./pages/requestboard/RequestBoardEdit";
import RequestBoardRegist from "./pages/requestboard/RequestBoardRegist";
import ServerCapacityPage from "./pages/servercapacity/ServerCapacityPage"; // 컴포넌트 임포트

function PrivateRoute({ children }) {
  const isAuthenticated = sessionStorage.getItem("accessToken") !== null;
  if (!isAuthenticated) {
    return <Navigate to="/?auth=login" replace />;
  }
  return children;
}

function App() {
  return (
    <>
    <audio id="ending-bgm" src={endingBgmUrl} preload="auto" loop />
    <Router>
      <Routes>
        <Route path="/break-room" element={<BreakRoomPage />} />
        {/* ✅ MainPage가 레이아웃 역할을 하도록 중첩 구조로 변경 */}
        <Route path="/" element={<MainPage />}>
          <Route index element={<InventoryPage />} />
          <Route path="inventory/:itemId" element={<InventoryDetailPage />} />
          <Route path="requestboard" element={<RequestBoardList />} />
          <Route path="requestboard/regist" element={<RequestBoardRegist />} />
          <Route path="requestboard/:id" element={<RequestBoardDetail />} />
          <Route path="requestboard/edit/:id" element={<RequestBoardEdit />} />
          {/* 서버용량조사 페이지 라우트 추가 */}
          <Route
            path="servercapacity"
            element={
              <PrivateRoute>
                <ServerCapacityPage />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
    </>
  );
}

export default App;
