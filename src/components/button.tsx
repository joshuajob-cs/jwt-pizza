/** @fileoverview The orange button used throughout the app. */
import React from 'react';

/**
 * - `title`: button text
 * - `onPress`: click handler
 * - `submit`: make it a form submit button, so the form's onSubmit runs
 * - `className`: extra Tailwind classes appended to the defaults
 */
interface Props {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  submit?: boolean;
  className?: string;
}

export default function Button(props: Props) {
  const finalClassName = `w-32 m-4 py-3 px-4 text-sm font-semibold rounded-lg border border-transparent bg-orange-800 text-white hover:bg-orange-600 ${props.className}`;
  return (
    <button disabled={props.disabled} type={props.submit ? 'submit' : 'button'} className={finalClassName} onClick={props.onPress}>
      {props.title}
    </button>
  );
}
