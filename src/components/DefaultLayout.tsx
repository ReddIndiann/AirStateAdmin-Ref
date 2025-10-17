import React, { useState, useEffect, useRef, JSX } from 'react';
import { Drawer } from "@mui/material";
import { NavLink, useNavigate } from "react-router-dom";
import { IoExitOutline, IoSettingsOutline, IoChevronDownOutline, IoChevronForwardOutline } from "react-icons/io5";
import { MdSupportAgent, MdOutlineBusinessCenter, MdOutlineDocumentScanner } from "react-icons/md";
import { FaUser } from "react-icons/fa";

import { RiHistoryFill } from "react-icons/ri";
import { RxDashboard } from "react-icons/rx";
import { signOut } from 'firebase/auth';
import { auth, storage } from '../firebase/config';
import { ref, getDownloadURL } from "firebase/storage";
import { toast } from 'react-hot-toast';
import { useUser } from "../Context/AuthContext";
import logo from "../assets/logo.svg";

interface NavLinkItem {
  to?: string;
  icon: JSX.Element;
  label: string;
  subItems?: NavLinkItem[];
}

interface NavItemProps {
  item: NavLinkItem;
  isCollapsed: boolean;
  closeDrawer?: () => void;
}

interface DefaultLayoutProps {
  children: React.ReactNode;
}

// Expanded menu structure with submenus
const navItems: NavLinkItem[] = [
  { 
    to: "/home", 
    icon: <RxDashboard />, 
    label: "Dashboard" 
  },
  { 
    icon: <MdOutlineBusinessCenter />, 
    label: "Services",
    subItems: [
      { to: "/consultancy", icon: <MdOutlineBusinessCenter />, label: "Pro Services" },
      { to: "/consultancy-list", icon: <MdOutlineBusinessCenter />, label: "Pro Services List" },
      // { to: "/tabs", icon: <MdSupportAgent />, label: "Client Services" },
      { to: "/services", icon: <MdOutlineDocumentScanner />, label: "Basic Services" }
    ]
  },
  { 
    icon: <RiHistoryFill />, 
    label: "History & Management",
    subItems: [
      { to: "/request", icon: <RiHistoryFill />, label: "Request History" },
      { to: "/customerMessage", icon: <RiHistoryFill />, label: "Message Customers" },
      { to: "/users", icon: <FaUser />, label: "User Managment" },
    ]
  },
  { 
    icon: <IoSettingsOutline />, 
    label: "Administration",
    subItems: [
      { to: "/adminConfig", icon: <RiHistoryFill />, label: "Admin Configuration" },
      { to: "/support", icon: <MdSupportAgent />, label: "Support" },
    ]
  },
  { to: "/profile", icon: <IoSettingsOutline />, label: "Settings" },
];

// NavItem component for sidebar navigation
const NavItem = ({ item, isCollapsed, closeDrawer }: NavItemProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const toggleSubmenu = (e: React.MouseEvent) => {
    if (!item.to) {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  // If the item has a direct link and no subitems
  if (item.to && !item.subItems) {
    return (
      <NavLink
        to={item.to}
        onClick={closeDrawer}
        className={({ isActive }) =>
          `flex items-center ${isCollapsed ? "justify-center" : "space-x-3"} 
           p-3 rounded-md hover:bg-red-200 hover:text-red-800 ${
             isActive ? "bg-red-200 text-red-800" : "text-black"
           }`
        }
      >
        <span className="text-xl">{item.icon}</span>
        {!isCollapsed && <span className="text-sm">{item.label}</span>}
      </NavLink>
    );
  }

  // For dropdown items
  return (
    <div className="relative">
      <div 
        onClick={toggleSubmenu}
        className={`flex items-center justify-between p-3 rounded-md cursor-pointer hover:bg-red-200 hover:text-red-800 ${isOpen ? "bg-red-200 text-red-800" : ""}`}
      >
        <div className={`flex items-center ${isCollapsed ? "justify-center" : "space-x-3"}`}>
          <span className="text-xl">{item.icon}</span>
          {!isCollapsed && <span className="text-sm">{item.label}</span>}
        </div>
        {!isCollapsed && (
          <span className="text-sm">
            {isOpen ? <IoChevronDownOutline /> : <IoChevronForwardOutline />}
          </span>
        )}
      </div>
      
      {isOpen && !isCollapsed && item.subItems && (
        <div className="ml-8 mt-1 space-y-1">
          {item.subItems.map((subItem, index) => (
            <NavLink
              key={index}
              to={subItem.to || "#"}
              onClick={closeDrawer}
              className={({ isActive }) =>
                `flex items-center space-x-3 p-2 rounded-md text-sm hover:bg-red-100 ${
                  isActive ? "bg-red-100 text-red-800" : "text-gray-700"
                }`
              }
            >
              <span className="text-sm">{subItem.icon}</span>
              <span className="text-sm">{subItem.label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
};

// Mobile drawer navigation with dropdowns
const DrawerNavItem = ({ item, closeDrawer }: { item: NavLinkItem, closeDrawer?: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const toggleSubmenu = (e: React.MouseEvent) => {
    if (!item.to) {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  if (item.to && !item.subItems) {
    return (
      <li className="list-none">
        <NavLink
          to={item.to}
          onClick={closeDrawer}
          className={({ isActive }) =>
            `flex items-center p-2 space-x-3 rounded-md ${isActive ? 'bg-red-200 text-[#AE1729]' : 'hover:bg-red-200'}`
          }
        >
          <span className="text-xl">{item.icon}</span>
          <h2>{item.label}</h2>
        </NavLink>
      </li>
    );
  }

  return (
    <li className="list-none">
      <div 
        onClick={toggleSubmenu}
        className={`flex items-center justify-between p-2 rounded-md cursor-pointer ${isOpen ? 'bg-red-200 text-[#AE1729]' : 'hover:bg-red-200'}`}
      >
        <div className="flex items-center space-x-3">
          <span className="text-xl">{item.icon}</span>
          <h2>{item.label}</h2>
        </div>
        <span className="text-xl">
          {isOpen ? <IoChevronDownOutline /> : <IoChevronForwardOutline />}
        </span>
      </div>
      
      {isOpen && item.subItems && (
        <div className="ml-6 mt-1 space-y-1">
          {item.subItems.map((subItem, index) => (
            <NavLink
              key={index}
              to={subItem.to || "#"}
              onClick={closeDrawer}
              className={({ isActive }) =>
                `flex items-center space-x-3 p-2 rounded-md text-sm ${
                  isActive ? 'bg-red-100 text-[#AE1729]' : 'hover:bg-red-100 text-gray-700'
                }`
              }
            >
              <span className="text-sm">{subItem.icon}</span>
              <span>{subItem.label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </li>
  );
};

const DefaultLayout: React.FC<DefaultLayoutProps> = ({ children }) => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [name, setName] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { logout } = useUser();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1070) setIsCollapsed(true);
      else setIsCollapsed(false);
    };

    handleResize(); // Initialize state on load
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const parsedUser = JSON.parse(user);
      setName(parsedUser.name || "Anonymous");
    }
  }, []);

  useEffect(() => {
    const loadProfilePicture = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        if (user.providerData[0]?.providerId === 'google.com') {
          setProfileImage(user.photoURL);
        } else {
          const profileRef = ref(storage, `profile/${user.uid}/profile.png`);
          const url = await getDownloadURL(profileRef);
          setProfileImage(url);
        }
      } catch (error) {
        console.error('Error loading profile picture:', error);
      }
    };

    loadProfilePicture();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success('Signed out successfully!');
      logout();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out. Please try again.');
    }
  };

  const firstName = name.split(" ")[0];
  const initials = name
    .split(" ")
    .map(part => part[0]?.toUpperCase() || "")
    .join("");

  const currentDate = new Date().toLocaleDateString("en-GB", {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="flex flex-col w-full h-screen bg-gray-200 overflow-hidden">
      {/* Header */}
      <header className="fixed bg-white w-full h-20 flex items-center justify-between px-8 py-4 z-50">
        {/* Header Content */}
        <div className="flex items-center justify-between">
          {/* Hamburger for mobile */}
          <button onClick={() => setDrawerOpen(true)} className="md:hidden">
            <svg
              className="w-8 h-8 text-gray-800"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16m-7 6h7"
              />
            </svg>
          </button>
    
          {/* Logo */}
          <img src={logo} className="w-40 hidden md:block mr-14" alt="Logo" />
    
          {/* Welcome Section */}
          <div className="hidden md:flex flex-col">
            <h1 className="text-2xl font-normal">Welcome, {firstName}</h1>
            <small className="text-gray-500">{currentDate}</small>
          </div>
        </div>
    
        {/* User Profile */}
        <div className="relative" ref={dropdownRef}>
          <div
            className="flex items-center space-x-4 cursor-pointer"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <h3 className="hidden sm:block">{name}</h3>
            <div
              className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center"
              style={{ backgroundColor: !profileImage ? "#fecaca" : "transparent" }}
            >
              {profileImage ? (
                <img src={profileImage} alt={name} className="w-full h-full object-cover" />
              ) : (
                <span style={{ color: "#AE1729" }}>{initials}</span>
              )}
            </div>
          </div>
    
          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg">
              <ul>
                <li>
                  <NavLink
                    to="/profile"
                    className="flex items-center py-3 px-5 space-x-2 hover:bg-gray-100"
                  >
                    <IoSettingsOutline className="text-xl" />
                    <span>Profile</span>
                  </NavLink>
                </li>
                <li>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center w-full py-3 px-5 space-x-2 hover:bg-gray-100"
                  >
                    <IoExitOutline className="text-xl" />
                    <span>Logout</span>
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </header>
    
      {/* Main Layout */}
      <div className="flex flex-row pt-20 h-full">
        {/* Side Panel */}
        <aside
          className={`fixed top-20 left-0 py-5 ${isCollapsed ? "w-20" : "w-64"} h-full bg-white shadow-md z-40 hidden md:block`}
        >
          <nav className="flex flex-col h-full justify-between">
            {/* Top Navigation Items */}
            <ul className="space-y-4 px-3">
              {navItems.map((item, index) => (
                <NavItem 
                  key={item.to || `nav-${index}`} 
                  item={item} 
                  isCollapsed={isCollapsed} 
                />
              ))}
            </ul>
    
            {/* Logout Button */}
            <div className="px-3 pb-20">
              <NavLink
                to="/"
                onClick={handleSignOut}
                className={`flex items-center ${isCollapsed ? "justify-center" : "space-x-3"} 
                  p-3 rounded-md hover:bg-red-200 text-gray-700`}
              >
                <IoExitOutline className="text-xl" />
                {!isCollapsed && <span className="text-sm">Logout</span>}
              </NavLink>
            </div>
          </nav>
        </aside>
    
        {/* Main Content */}
        <main
          className={`flex-1 h-full p-5 bg-gray-100 overflow-y-auto ${isCollapsed ? "md:ml-20" : "md:ml-64"}`}
        >
          {children}
        </main>
      </div>
      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        classes={{ paper: "w-72" }}
      >
        <div className="flex items-center justify-center p-4" onClick={() => setDrawerOpen(false)}>
          <img src={logo} className="w-44" alt="logo" />
        </div>
        <nav className="p-4 flex-1">
          <ul className="space-y-2">
            {navItems.map((item, index) => (
              <DrawerNavItem
                key={item.to || `drawer-nav-${index}`}
                item={item}
                closeDrawer={() => setDrawerOpen(false)}
              />
            ))}
          </ul>
        </nav>
    
        <div className="p-4">
          <li className="list-none">
            <div
              onClick={() => {
                handleSignOut();
                setDrawerOpen(false);
              }}
              className="flex items-center p-2 space-x-3 rounded-md cursor-pointer hover:bg-red-200"
            >
              <IoExitOutline className="text-xl" />
              <h2>Logout</h2>
            </div>
          </li>
        </div>
      </Drawer> 
    </div>
  );
};

export default DefaultLayout;