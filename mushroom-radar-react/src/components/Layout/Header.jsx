import React, { useState } from 'react'
import './Header.css'

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <header className="header">
      <div className="logo">
        <a href="/index.html">
          <img src="/assets/logo.png" alt="GINKGOLABS" className="logo-image" />
        </a>
      </div>
      
      {/* Desktop Navigation */}
      <nav className="nav desktop-nav">
        <a href="/about.html" className="nav-link">About</a>
        <div className="nav-dropdown">
          <a href="/mushroom-radar.html" className="nav-link">Products</a>
          <div className="dropdown-content">
            <a href="/mushroom-radar.html" className="dropdown-link">Mushroom Radar</a>
          </div>
        </div>
        <a href="/contact.html" className="nav-link">Contact</a>
        <a href="/blog.html" className="nav-link">Blog</a>
        <a href="/careers.html" className="nav-link">Careers</a>
      </nav>
      
      {/* Mobile Menu Button */}
      <button 
        className={`mobile-menu-btn ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={toggleMobileMenu}
        aria-label="Toggle mobile menu"
      >
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
      </button>
      
      {/* Mobile Navigation */}
      <nav className={`mobile-nav ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-nav-content">
          <a href="/about.html" className="mobile-nav-link">About</a>
          <a href="/mushroom-radar.html" className="mobile-nav-link">Products</a>
          <a href="/contact.html" className="mobile-nav-link">Contact</a>
          <a href="/blog.html" className="mobile-nav-link">Blog</a>
          <a href="/careers.html" className="mobile-nav-link">Careers</a>
        </div>
      </nav>
    </header>
  )
}

export default Header
