/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import  { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import "../styles/ChildLogin.css";
import axios from 'axios';
import { toast } from 'react-hot-toast';

const ChildLogin = ({ onStartQuiz }) => {
  const navigate = useNavigate();
  const [data, setData] = useState({ 
    childname: '',
    password: '',
});

const loginChild = async (e) => {
  e.preventDefault();
  console.log(data);
  const { childname, password } = data;
  if (childname.trim() !== '') {
    try {
      const response = await axios.post('/login', { childname, password });
      const { error, sessionId, isAdmin } = response.data;

      if (error) {
        toast.error(error);
      } else {
        setData({ childname: '', password: '' });
        console.log('Session started successfully:', sessionId);

        if (isAdmin) {
          console.log("He is admin");
          navigate('/report'); // Redirect to reports page
        } else {
          onStartQuiz(childname, sessionId);
          navigate('/quiz'); // Redirect to quiz page
        }
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred while logging in.');
    }
  }
};


  return (
    <div className="start-screen">
      <h1>Login</h1>
      <form onSubmit={loginChild}>
        <label htmlFor="childName">Enter name:</label>
        <input
          type="text"
          placeholder="Enter name"
          value={data.childname} 
          onChange={(e) => setData({ ...data, childname: e.target.value })} 
        />
        <label>Password</label>
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

export default ChildLogin;



