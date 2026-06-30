import { useState } from 'react'
import axios from 'axios'
import { Terminal, Code2, LogIn, UserPlus, Play, Loader2, LogOut, Keyboard } from 'lucide-react'
import Editor from '@monaco-editor/react'

axios.defaults.baseURL = 'https://codeditor-api.onrender.com'

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')

  const [language, setLanguage] = useState('python')
  const [code, setCode] = useState('name = input("Enter name: ")\nprint(f"Hello, {name}!")')
  const [stdin, setStdin] = useState('')
  const [output, setOutput] = useState('')
  const [isExecuting, setIsExecuting] = useState(false)

  const handleAuth = async (e) => {
    e.preventDefault()
    setAuthError('')
    
    try {
      const endpoint = isLogin ? '/login' : '/register'
      const response = await axios.post(endpoint, { email, password })

      if (isLogin) {
        const accessToken = response.data.access_token
        localStorage.setItem('token', accessToken)
        setToken(accessToken)
      } else {
        setIsLogin(true)
        alert("Registration successful! Please log in.")
        setPassword('')
      }
    } catch (err) {
      setAuthError(err.response?.data?.detail || "Authentication failed")
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setOutput('')
  }

  const handleLanguageChange = (e) => {
    const newLang = e.target.value
    setLanguage(newLang)
    
    if (newLang === 'python') {
      setCode('name = input("Enter name: ")\nprint(f"Hello, {name}!")')
    } else if (newLang === 'cpp') {
      setCode('#include <iostream>\n#include <string>\n\nint main() {\n    std::string name;\n    std::cout << "Enter name: ";\n    std::cin >> name;\n    std::cout << "Hello, " << name << "!" << std::endl;\n    return 0;\n}')
    }
  }

  const handleRunCode = async () => {
    setIsExecuting(true)
    setOutput('Executing in cloud container...\n')

    try {
      const response = await axios.post('/execute', { language, code, stdin })
      const { stdout, stderr, exit_code, error } = response.data

      if (error) {
        setOutput(`[System Timeout/Error]\n${error}`)
      } else if (exit_code !== 0) {
        setOutput(`[Compilation/Runtime Error - Exit Code ${exit_code}]\n\n${stderr}`)
      } else {
        setOutput(stdout || '[Program finished with no output]')
      }
    } catch (err) {
      setOutput(`[Network Error]\nCould not reach the execution engine.\n\n${err.message}`)
    } finally {
      setIsExecuting(false)
    }
  }

  if (token) {
    return (
      <div className="h-screen bg-gray-950 text-gray-100 flex flex-col overflow-hidden">
        <header className="bg-gray-900 border-b border-gray-800 p-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <Code2 className="text-blue-500" />
            <h1 className="text-xl font-bold tracking-tight">Cloud Editor</h1>
            
            <select 
              value={language} 
              onChange={handleLanguageChange}
              className="ml-4 bg-gray-950 border border-gray-700 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:border-blue-500"
            >
              <option value="python">Python 3</option>
              <option value="cpp">C++ (g++)</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={handleRunCode}
              disabled={isExecuting}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white font-medium px-4 py-1.5 rounded transition flex items-center gap-2"
            >
              {isExecuting ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              {isExecuting ? 'Running...' : 'Run Code'}
            </button>
            <button 
              onClick={handleLogout}
              className="text-zinc-500 hover:text-red-400 transition-colors"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <main className="flex-1 flex flex-col lg:flex-row min-h-0">
          <div className="flex-1 border-r border-gray-800 relative">
            <Editor
              height="100%"
              language={language}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 15,
                fontFamily: 'monospace',
                padding: { top: 16 },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
              }}
            />
          </div>

          <div className="w-full lg:w-1/3 bg-[#1e1e1e] flex flex-col min-h-0 shrink-0 border-l border-gray-800">
            <div className="flex flex-col h-1/2 border-b border-gray-800">
              <div className="bg-gray-900 px-4 py-2 flex items-center gap-2 shrink-0 border-b border-gray-800">
                <Keyboard size={16} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-300">Input (stdin)</span>
              </div>
              <textarea
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                placeholder="Type inputs here before running the code..."
                className="w-full flex-1 bg-gray-950 p-4 font-mono text-sm text-gray-300 resize-none focus:outline-none p-4"
              />
            </div>

            <div className="flex flex-col h-1/2 min-h-0">
              <div className="bg-gray-900 px-4 py-2 flex items-center gap-2 shrink-0 border-b border-gray-800">
                <Terminal size={16} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-300">Terminal Output</span>
              </div>
              <div className="p-4 flex-1 overflow-auto bg-gray-950">
                <pre className="font-mono text-sm text-green-400 whitespace-pre-wrap break-words">
                  {output}
                </pre>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
      <div className="h-screen bg-[#09090b] text-zinc-300 flex flex-col overflow-hidden font-sans selection:bg-indigo-500/30">
        
        {/* Classy Glassmorphism Header */}
        <header className="bg-black/20 backdrop-blur-md border-b border-white/5 px-6 py-4 flex justify-between items-center shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/10 p-1.5 rounded-md border border-indigo-500/20">
              <Code2 size={20} className="text-indigo-400" />
            </div>
            <h1 className="text-lg font-semibold tracking-wide text-zinc-100">
              Nova Editor {/* <-- CHANGE YOUR APP NAME HERE */}
            </h1>
            
            <div className="h-4 w-px bg-white/10 mx-3"></div> {/* Elegant divider */}
            
            <select 
              value={language} 
              onChange={handleLanguageChange}
              className="bg-transparent text-sm text-zinc-400 hover:text-zinc-200 cursor-pointer focus:outline-none transition-colors"
            >
              <option value="python" className="bg-zinc-900">Python 3.11</option>
              <option value="cpp" className="bg-zinc-900">C++ (g++)</option>
            </select>
          </div>

          <div className="flex items-center gap-5">
            <button 
              onClick={handleRunCode}
              disabled={isExecuting}
              className="bg-zinc-100 hover:bg-white text-zinc-900 disabled:bg-zinc-800 disabled:text-zinc-500 font-medium px-5 py-1.5 rounded-full shadow-sm transition-all flex items-center gap-2 text-sm"
            >
              {isExecuting ? <Loader2 size={16} className="animate-spin" /> : <Play size={14} className="fill-current" />}
              {isExecuting ? 'Executing...' : 'Run'}
            </button>
            <button 
              onClick={handleLogout}
              className="text-zinc-500 hover:text-red-400 transition-colors"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Main Split Interface */}
        <main className="flex-1 flex flex-col lg:flex-row min-h-0">
          
          {/* Left Pane: Monaco Editor */}
          <div className="flex-1 relative bg-[#09090b]">
            <Editor
              height="100%"
              language={language}
              theme="vs-dark" // Note: You can change this to 'light' if you want a bright theme!
              value={code}
              onChange={(value) => setCode(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                fontLigatures: true,
                padding: { top: 24 },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                lineNumbersMinChars: 4,
                lineDecorationsWidth: 0,
              }}
            />
          </div>

          {/* Right Pane: Premium Terminal */}
          <div className="w-full lg:w-1/3 flex flex-col min-h-0 shrink-0 border-l border-white/5 bg-[#09090b] shadow-2xl">
            <div className="flex flex-col h-[45%] border-b border-white/5">
              <div className="px-5 py-3 flex items-center gap-2 shrink-0">
                <span className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">Standard Input</span>
              </div>
              <textarea
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                placeholder="Type your inputs here..."
                className="w-full flex-1 bg-transparent px-5 py-2 font-mono text-sm text-zinc-400 placeholder:text-zinc-700 resize-none focus:outline-none transition-colors"
              />
            </div>

            <div className="flex flex-col flex-1 min-h-0">
              <div className="px-5 py-3 flex items-center gap-2 shrink-0">
                <span className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">Output Console</span>
              </div>
              <div className="px-5 py-2 flex-1 overflow-auto">
                <pre className="font-mono text-sm text-zinc-300 whitespace-pre-wrap break-words leading-relaxed">
                  {output}
                </pre>
              </div>
            </div>
          </div>

        </main>
      </div>
    )
  }