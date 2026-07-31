import next from "next"
import { useRouter } from "next/navigation"
import { useEffect } from "react";

const mainPage = () => {
const router = useRouter();

useEffect(() => {
    router.push("/login");

})


}

export default mainPage

