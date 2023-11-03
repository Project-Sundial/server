import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserForm from './UserForm';

const CreateUserForm = ({onSubmitCreateUserForm, addErrorMessage}) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const validateForm = () => {
        if (username.length < 2) {
            addErrorMessage("Must have a username longer than 1 character.");
            return false;
        }
    
        if (password.length < 8) {
            addErrorMessage("Must have a password longer than 8 characters");
            return false;
        }
        return true;
      }
    
      const handleSubmitForm = (event) => {
        event.preventDefault()
        
        if(validateForm()) {
            const userData = {
                username: username,
                password: password
            };
        
            navigate('/');
            return onSubmitCreateUserForm(userData);
        }
      }


    return (
        <>
            <UserForm 
                username={username}
                setUsername={setUsername}
                password={password}
                setPassword={setPassword}
                onSubmit={handleSubmitForm}/>
        </>
    )
};

export default CreateUserForm;