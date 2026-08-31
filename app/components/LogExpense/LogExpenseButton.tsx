"use client";

import React from "react";
import { Button, ButtonProps } from "antd";
import { PlusOutlined } from "@ant-design/icons";

export interface LogExpenseButtonProps extends Omit<ButtonProps, "onClick"> {
  onClick?: () => void;
  buttonText?: string;
}

export const LogExpenseButton: React.FC<LogExpenseButtonProps> = ({
  onClick,
  buttonText = "Nova Despesa",
  type = "primary",
  size = "large",
  icon = <PlusOutlined />,
  ...restProps
}) => {
  return (
    <Button
      type={type}
      icon={icon}
      size={size}
      onClick={onClick}
      {...restProps}
    >
      {buttonText}
    </Button>
  );
};

export default LogExpenseButton;
