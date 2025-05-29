import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [displaySidebar, setDisplaySidebar] = useState(true);

  return (
    <>
      <div>
        <h1 className="text-4xl text-center p-5 font-bold text-blue-700">Chat App</h1>
      </div>
      <div className="grid grid-cols-2 ">
        <div className="bg-green-100">{displaySidebar ? "open" : "close"} Sidebar
          <div>Chat 1</div>
          <div>Group - 1</div>
        </div>
        <div>Chat</div>
      </div>

      <div>
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <button onClick={() => setDisplaySidebar((displaySidebar) => !displaySidebar)}>
          Show/Hide Sidebar
        </button>
      </div>

      <p>
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
