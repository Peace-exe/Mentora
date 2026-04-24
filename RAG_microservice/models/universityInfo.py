from beanie import Document

from typing import Literal


class UniversityInfo(Document):

    fact : str
    factId : str
    subject : str
    source : str
    hasTable : bool
    hasURL : bool
    lang : Literal["en", "hin"] = "en"

    class Settings:
        name = "universityInfo"



