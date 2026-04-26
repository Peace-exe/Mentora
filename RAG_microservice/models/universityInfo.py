from beanie import Document

from typing import Literal, Optional


class UniversityInfo(Document):

    info : str
    infoId : str
    category : str
    source : str
    lang : Literal["en", "hin"] = "en"
    hasTable : bool
    hasURL : bool
    hasMobileNo : bool
    hasEmail : bool
    chunks: Optional[list[str]] = None
    hyQues : Optional[list[list[str]]] = None

    class Settings:
        name = "universityInfo"



