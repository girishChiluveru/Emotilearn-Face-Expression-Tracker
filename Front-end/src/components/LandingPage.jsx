import { useEffect } from 'react';
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
      <div className="landing-page-container hidden-scrollbar">
        {/* Hero Section */}
        <div className="hero-section">
          <h1 className="hero-title">Welcome to Emoti-Learn</h1>
          <p className="hero-subtitle">
            An engaging experience awaits you! Empowering children with learning tools that make education fun.
          </p>
          <Link to="/child-login">
            <button className="hero-button">Start Playing</button>
          </Link>
        </div>

        {/* About Us Section */}
        <div className="about-section">
          <h2>About Us</h2>
          <p>
            At Emot-Learn, we believe that learning should be an exciting adventure. We provide a unique platform filled with fun, interactive games designed to engage and educate children of all ages. Our tools not only enhance learning but also track progress in a way that helps children grow, develop, and excel at their own pace.
          </p>
          <p>
            Our mission is to help children discover the joy of learning, encouraging curiosity and the pursuit of knowledge while making sure the process is enjoyable and effective. Whether it’s through games that teach foundational skills or activities that promote critical thinking, we’re here to make education as fun and engaging as it should be.
          </p>
        </div>

        {/* Features Section */}
        <div className="features-section">
          <h2>Features</h2>
          <div className="feature-cards">
            <div className="feature-card">
              <h3>Interactive Games</h3>
              <p>
                Our interactive games turn learning into an adventure! From math puzzles to vocabulary challenges, every game is designed to captivate children’s attention while reinforcing important skills in a playful environment.
              </p>
            </div>
            <div className="feature-card">
              <h3>Track Progress</h3>
              <p>
                Parents and educators can easily monitor progress with intuitive dashboards. See how children are improving across subjects, identify areas where they might need help, and celebrate milestones together.
              </p>
            </div>
            <div className="feature-card">
              <h3>Adaptive Learning</h3>
              <p>
                Our platform adapts to each child’s learning style. The more they play, the smarter our system gets, personalizing lessons to suit their pace and challenges, ensuring every child has an optimal learning experience.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Us Section */}
        <div className="contact-section">
          <h2>Contact Us</h2>
          <p>
            Have questions or need support? We’re here to help! Don’t hesitate to reach out. We value every user and are committed to providing the best experience possible.
          </p>
          <p>Email: <a href="mailto:contact@myproject.com">contact@myproject.com</a></p>
          <p>Mobile 1: <a href="tel:+1234567890">+1234567890</a></p>
          <p>Mobile 2: <a href="tel:+0987654321">+0987654321</a></p>
        </div>
      </div>
    </Layout>
  );
};

export default LandingPage;
