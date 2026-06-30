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

  // --- WORKSPACE UI (Logged In) ---
  if (token) {
    return (
      <div className="h-screen bg-[#09090b] text-zinc-300 flex flex-col overflow-hidden font-sans selection:bg-indigo-500/30">
        
        {/* Classy Glassmorphism Header */}
        <header className="bg-black/20 backdrop-blur-md border-b border-white/5 px-6 py-4 flex justify-between items-center shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/10 p-1.5 rounded-md border border-indigo-500/20">
              <Code2 size={20} className="text-indigo-400" />
            </div>
            <h1 className="text-lg font-semibold tracking-wide text-zinc-100">
              Nova Editor
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
              theme="vs-dark"
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

  // --- LOGIN UI (Logged Out) ---
  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 font-sans selection:bg-indigo-500/30">
      <div className="max-w-md w-full bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-white/5 p-8 shadow-2xl">
        <div className="text-center space-y-3 mb-8">
          <div className="bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20 inline-block">
            <Code2 size={32} className="text-indigo-400" />
          </div>
          <h2 className="text-2xl font-semibold text-zinc-100 tracking-wide">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-sm text-zinc-400">
            {isLogin ? 'Enter your credentials to access your workspace' : 'Sign up to start running code in the cloud'}
          </p>
        </div>

        {authError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg mb-6 text-center">
            {authError}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold tracking-wider text-zinc-500 uppercase">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-lg px-4 py-2.5 text-zinc-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-zinc-700"
              placeholder="developer@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold tracking-wider text-zinc-500 uppercase">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-lg px-4 py-2.5 text-zinc-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-zinc-700"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2 shadow-lg shadow-indigo-500/20 mt-2"
          >
            {isLogin ? <><LogIn size={18} /> Sign In</> : <><UserPlus size={18} /> Register</>}
          </button>
        </form>

        <div className="text-center text-sm text-zinc-500 mt-6 border-t border-white/5 pt-6">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button"
            onClick={() => { setIsLogin(!isLogin); setAuthError(''); }}
            className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>
      </div>
    </div>
  )
}