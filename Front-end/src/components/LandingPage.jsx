import  { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from './Layout'; // Adjust the path as necessary
import '../styles/LandingPage.css'; // Make sure the CSS path is correct

const LandingPage = () => {
  // Scroll to the top when the component is mounted
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []); // Empty dependency array ensures this runs only once when the component is mounted

  return (
    <Layout hideNavbar={true}>
      <div className="landing-page-container">
        <div className="hero-section">
          <h1 className="hero-title">Welcome to MyProject</h1>
          <p className="hero-subtitle">An engaging experience awaits you!</p>
          <Link to="/child-login">
            <button className="hero-button">Start Playing</button>
          </Link>
        </div>

        <div className="about-section">
          <h2>About Us</h2>
          <p>
            We provide interactive tools and games designed to engage and help children learn in an enjoyable way. Our platform ensures a unique experience for every child with tools that track progress and encourage continuous learning.
          </p>
        </div>

        <div className="features-section">
          <h2>Features</h2>
          <div className="feature-cards">
            <div className="feature-card">
              <h3>Interactive Games</h3>
              <p>Engage in games designed to stimulate learning while having fun.</p>
            </div>
            <div className="feature-card">
              <h3>Track Progress</h3>
              <p>Monitor and track your child&apos;s progress with easy-to-use dashboards.</p>
            </div>
            <div className="feature-card">
              <h3>Adaptive Learning</h3>
              <p>Experiences personalized learning paths based on performance.</p>
            </div>
          </div>
        </div>

        <div className="contact-section">
          <h2>Contact Us</h2>
          <p>Email: <a href="mailto:contact@myproject.com">contact@myproject.com</a></p>
          <p>Mobile 1: <a href="tel:+1234567890">+1234567890</a></p>
          <p>Mobile 2: <a href="tel:+0987654321">+0987654321</a></p>
        </div>
      </div>
    </Layout>
  );
};

export default LandingPage;
