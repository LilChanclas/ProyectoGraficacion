"use client";
import React, {useState} from "react";
import Link from "next/link";
import { MenuItem} from "./Navbar"
import { HiOutlineChevronDown } from "react-icons/hi";

interface Props {
    item: MenuItem;
}

export default function Dropdown(props: Props){
    const { item } = props;
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const MenuItems = item?.children ? item.children : [];

    const toggle = () => {
        setIsOpen(old => !old);
    }

    const transClass = isOpen ? "flex" : "hidden";

    return (
        <>
            <div className="relative">
                <button className="flex items-center gap-2 text-purple-700 font-semibold text-lg transition duration-300 hover:scale-110"
                onClick={toggle}>
                    <span>{item.title}</span>
                    <HiOutlineChevronDown className="w-5 h-5" />
                    </button>
                <div className={`absolute top-8 z-30 w-[250px] min-h-[300px] flex flex-col py-4 
                bg-pruple-700 rounded-md ${transClass}`}>
                    {
                        MenuItems.map(item =>
                            <Link
                            key={item.route}
                            className="transition duration-300 hover:scale-110 hover:text-purple-700 px-4 py-1"
                            href={item?.route || ""}
                            onClick={toggle}
                            >{item.title}</Link>
                        )
                    }
                </div>
            </div>
            {
                isOpen ? <div className="fixed top-0 right-0 bottom-0 left-0 z-20 bg-black/40" onClick={toggle}></div> : <></>
            }
        </>
    )
}