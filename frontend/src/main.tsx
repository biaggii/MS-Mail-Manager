import React from 'react'
import {createRoot} from 'react-dom/client'
import './style.css'
import App from './App'
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

const container = document.getElementById('root')

const root = createRoot(container!)

root.render(
    <React.StrictMode>
        <TooltipProvider>
            <App/>
            <Toaster />
        </TooltipProvider>
    </React.StrictMode>
)
