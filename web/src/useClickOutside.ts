import { useEffect, useRef } from "react";

function useClickOutside(callback: () => void) {
  const ref = useRef(null as null | HTMLElement);
  // See https://stackoverflow.com/questions/32553158/detect-click-outside-react-component.
  useEffect(() => {
    // TODO: get rid of any
    function handleClickOutside(event: any) {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [ref, callback]);

  return ref;
}

export default useClickOutside;
