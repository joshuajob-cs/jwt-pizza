/** @fileoverview The logout page, which logs out as soon as it opens. */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { pizzaService } from '../service/service';
import View from './view';
import { User } from '../service/pizzaService';

interface Props {
  setUser: (user: User | null) => void;
}

/**
 * Logout page at `/logout`. There is no button: on load it calls [DELETE] /api/auth (via pizzaService.logout,
 * which also removes the token), clears App's user, and goes home.
 */
export default function Logout(props: Props) {
  const navigate = useNavigate();

  React.useEffect(() => {
    pizzaService.logout();
    props.setUser(null);
    navigate('/');
  }, []);

  return (
    <View title='Logout'>
      <div className='text-neutral-100'>Logging out ...</div>
    </View>
  );
}
