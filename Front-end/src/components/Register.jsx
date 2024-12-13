import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Register.css';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const ChildRegister = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({
    childname: '',
    password: '',
  });

  const registerChild = async (e) => {
    e.preventDefault();
    const { childname, password } = data;

    if (childname.trim() !== '' && password.trim() !== '') {
      try {
        const response = await axios.post('/register', { childname, password });
        const { error, message } = response.data;

        if (error) {
          toast.error(error);
        } else {
          setData({ childname: '', password: '' });
          toast.success(message || 'Registration successful');
          navigate('/child-login');
        }
      } catch (error) {
        console.error(error);
        toast.error('An error occurred while registering.');
      }
    } else {
      toast.error('Both fields are required.');
    }
  };

  return (
    <div className="start-screen">
      <h1>Child Register</h1>
      <form onSubmit={registerChild}>
        <label htmlFor="childname">Child Name:</label>
        <input
          type="text"
          placeholder="Enter name"
          value={data.childname}
          onChange={(e) => setData({ ...data, childname: e.target.value })}
        />
        <label htmlFor="password">Password:</label>
        <input
          type="password"
          placeholder="Enter password"
          value={data.password}
          onChange={(e) => setData({ ...data, password: e.target.value })}
        />
        <br />
        <button type="submit" className="submit-button">Submit</button>
      </form>
    </div>
  );
};

export default ChildRegister;
