import React, { Component, type ReactNode } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "./theme";
import App from "./App";
import { AuthProvider } from "./auth/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { getDeploymentConfig } from "./api/endpoints";
import { CountryConfigProvider, DEFAULT_CONFIG, setCountryConfig, type CountryConfig } from "./config/countryConfig";
import "./i18n";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return <div style={{ padding: 40, color: "red" }}><h1>App Error</h1><pre>{this.state.error.message}{"\n"}{this.state.error.stack}</pre></div>;
    }
    return this.props.children;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
  },
});

async function bootstrap() {
  let countryConfig: CountryConfig = DEFAULT_CONFIG;
  try {
    countryConfig = await getDeploymentConfig();
    setCountryConfig(countryConfig);
  } catch {
    // Fall back to the default (Argentina) config if /config is unreachable.
  }

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <CountryConfigProvider value={countryConfig}>
              <NotificationProvider>
                <BrowserRouter basename={import.meta.env.BASE_URL} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                  <AuthProvider>
                    <App />
                  </AuthProvider>
                </BrowserRouter>
              </NotificationProvider>
            </CountryConfigProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
}

bootstrap();
