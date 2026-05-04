import Sidebar from "@/components/Sidebar"
import MainContent from "@/components/MainContent"

function App() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <MainContent />
    </div>
  )
}

export default App