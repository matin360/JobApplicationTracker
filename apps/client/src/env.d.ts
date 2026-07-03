// This tells TypeScript about your custom environment variables, eliminating type errors
interface ImportMetaEnv {  
  readonly VITE_APP_NAME: string;  
  readonly VITE_API_URL: string;  
  readonly VITE_API_KEY?: string; // Optional variable  
  // Add other variables here  
}  
 
interface ImportMeta {  
  readonly env: ImportMetaEnv;
}