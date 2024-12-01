/* eslint-disable -- fragile, do not touch */
'use client';

import './mention-list.scss';

import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

interface PropsType {
  items: { id: string; label: string }[];
  command: (item: { id: string; label: string }) => void;
}

export default forwardRef((props: PropsType, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command({ id: item.id, label: item.label }); // Pass the item's ID or full object if needed
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: React.KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }

      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }

      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  return (
    <div className="dropdown-menu">
      {props.items.length ? (
        props.items.map((item, index) => (
          <button
            className={index === selectedIndex ? 'is-selected' : ''}
            key={index}
            onClick={() => {
              selectItem(index);
            }}
          >
            {item.label}
          </button>
        ))
      ) : (
        <div className="item" style={{ fontSize: '16px' }}>
          No users found!
        </div>
      )}
    </div>
  );
});
