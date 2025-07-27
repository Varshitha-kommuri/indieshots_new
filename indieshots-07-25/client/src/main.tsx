import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "next-themes";
import { app } from './firebaseConfig';


createRoot(document.getElementById("root")!).render(
  <ThemeProvider 
    attribute="class" 
    defaultTheme="dark" 
    enableSystem={true}
    storageKey="theme"
    disableTransitionOnChange={false}
  >
    <App />
  </ThemeProvider>
);
