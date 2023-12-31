import { useEffect } from 'react';
import { CssBaseline, createTheme, ThemeProvider} from '@mui/material'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import useTemporaryMessages from './hooks/useTemporaryMessages';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import MainPage from './components/MainPage';
import PaddedAlert from './components/PaddedAlert';
import CreateUserForm from './components/CreateUserForm';
import LoginForm from './components/LoginForm';
import { useAuth } from './context/AuthProvider';
import { FONT_COLOR, BACKGROUND_COLOR, THEME_COLOR, ACCENT_COLOR, HOVER_COLOR } from './constants/colors';
import { checkDBAdmin } from './services/users';
import MachinesTable from './components/MachinesTable';

const theme = createTheme({
  components: {
    MuiButton: {
      styleOverrides: {
        contained: {
          backgroundColor: ACCENT_COLOR, 
          color: THEME_COLOR,
          '&:hover': {
            backgroundColor: HOVER_COLOR,
          },
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          backgroundColor: THEME_COLOR,
          '& .MuiDataGrid-cell--editing': {
            backgroundColor: BACKGROUND_COLOR,
          },
        },
      }
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          color: ACCENT_COLOR,
        },
        icon: {
          color: ACCENT_COLOR
        }
      }
    },
    MuiList: {
      styleOverrides: {
        root: {
          backgroundColor: THEME_COLOR
        },
      }
    }
  },
  typography: {
    allVariants: {
      fontFamily: 'Fira Code, monospace'
    },
    body1: {
      color: FONT_COLOR,
      fontSize: 21,
    },
    body2: {
      color: FONT_COLOR,
      fontWeight: 500,
    },
  },
  palette: {
    background: {
      default: BACKGROUND_COLOR,
    },
  }
});

const App = () => {
  const [errorMessages, addErrorMessage] = useTemporaryMessages(3000);
  const [successMessages, addSuccessMessage] = useTemporaryMessages(3000);
  const { token, clearToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.title = 'Sundial';
  }, []);

  const handleAxiosError = (error) => {
    console.log(error);
    let message = 'Something went wrong: ';
    if (error.response) {
      message += error.response.data.message;
      if (error.response.status === 401) {
        clearToken();
      }
    } else {
      message += error.message;
    }

    addErrorMessage(message);
  };

  useEffect(() => {
    const handleInitialNavigate = async () => {
      try {
        const adminExists = await checkDBAdmin();
        if (!adminExists) {
          navigate('/create-user');
          return;
        }

        if (!token) {
          navigate('/login');
        }

        if (location.pathname === '/') {
          navigate('/jobs');
        }
      } catch(error) {
        handleAxiosError(error);
      }
    }

    handleInitialNavigate();
  }, [token]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Header />
      {Object.keys(successMessages).map((message) => (
        <PaddedAlert key={message} severity="success" message={message} />
      ))}
      {Object.keys(errorMessages).map((message) => (
        <PaddedAlert key={message} severity="error" message={message} />
      ))}
      <Routes>
        <Route 
          path="/jobs/*" 
          element={<ProtectedRoute />}>
            <Route
              path="*"
              element={
                <MainPage
                  onAxiosError={handleAxiosError}
                  addErrorMessage={addErrorMessage}
                  addSuccessMessage={addSuccessMessage}
              />} 
            />
        </Route>
        <Route
          path="/machines"
          element={<ProtectedRoute />}>
            <Route
              path=""
              element={
                <MachinesTable
                  onAxiosError={handleAxiosError}
                  addSuccessMessage={addSuccessMessage}
              />}
            />
        </Route>
        <Route 
          path="/login" 
          element={
            <LoginForm
              onAxiosError={handleAxiosError}
              addErrorMessage={addErrorMessage}
              addSuccessMessage={addSuccessMessage}
            />}
        />
        <Route 
          path="/create-user" 
          element={
            <CreateUserForm
              onAxiosError={handleAxiosError} 
              addErrorMessage={addErrorMessage}
              addSuccessMessage={addSuccessMessage}
            />}
        />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
