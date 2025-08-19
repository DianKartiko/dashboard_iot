import { NavLink } from "react-router-dom";

const NavLinkItem = ({ item, closeSidebar }) => (
    <li key={item.path}>
        <NavLink
            to={item.path}
            className={({ isActive }) =>
                `flex items-center p-2 rounded-lg group transition ${
                    isActive
                        ? "bg-gray-100 text-gray-800"
                        : "text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                }`
            }
            onClick={closeSidebar}
        >
            {item.icon}
            <span className="ms-3">{item.name}</span>
        </NavLink>
    </li>
);

export default NavLinkItem;
