/** @fileoverview The "home > admin-dashboard > create-store" trail shown under the header. */
import React from 'react';
import { NavLink } from 'react-router-dom';
import { HouseIcon, GreaterThanIcon } from '../icons';

interface Props {
  location: string;
}

/**
 * Splits the current path into segments and links each one, so you can jump back up to any parent page.
 * @param props.location - the current path without its leading `/`, e.g. `admin-dashboard/create-store`
 */
export default function Breadcrumb(props: Props) {
  let currentPath = '';
  const paths = props.location.split('/').map((path) => {
    currentPath += '/' + path;
    return (
      <li key={path} className="inline-flex items-center text-sm font-semibold text-gray-800 truncate" aria-current="page">
        <GreaterThanIcon />

        <NavLink className="flex items-center text-sm text-gray-600 hover:text-blue-600 focus:outline-none focus:text-blue-600" to={currentPath}>
          {path}
        </NavLink>
      </li>
    );
  });
  return (
    <ol className="flex items-center whitespace-nowrap py-2 px-4 bg-gray-300">
      <li className="inline-flex items-center">
        <NavLink className="flex items-center text-sm text-gray-500 hover:text-blue-600 focus:outline-none focus:text-blue-600" to="/">
          <span className="mx-1">
            <HouseIcon />
          </span>
          home
        </NavLink>
      </li>
      {location && paths}
    </ol>
  );
}
