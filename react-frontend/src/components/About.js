import React from "react";
import "./About.css";

const About = () => {
  return (
    <div className="about-container">
      <h2>About Us</h2>
      <div className="about-section">
        <h3>Our Mission</h3>
        <p>We are committed to delivering high-quality services that simplify lives and enhance productivity.</p>
      </div>
      <div className="about-section">
        <h3>Our Vision</h3>
        <p>To be a global leader in technological innovation and customer satisfaction.</p>
      </div>
      <div className="about-section">
        <h3>Contact Information</h3>
        <p>Email: <a href="mailto:info@example.com">s.shah.27262@khi.iba.edu.pk</a></p>
        <p>Phone: +92-3012120196</p>
        <p>Location: Model Colony, Karachi, Pakistan</p>
      </div>
    </div>
  );
};

export default About;
