import { Button, useDisclosure } from "@chakra-ui/react";
import { useState } from "react";

//Tools
import HtmlAndExcelExportModal from "./HtmlAndExcelExportModal";

const HtmlAndExcelExport = () => {
  //ChakraUI
  const { isOpen, onOpen, onClose } = useDisclosure();

  //States
  const [isLoading, setIsLoading] = useState<boolean>(false);

  return (
    <div>
      <Button
        isLoading={isLoading}
        colorScheme="rose"
        className="w-full"
        onClick={onOpen}
      >
        دریافت خروجی
      </Button>
      <HtmlAndExcelExportModal
        isOpen={isOpen}
        onOpen={onOpen}
        onClose={onClose}
      />
    </div>
  );
};

export default HtmlAndExcelExport;
