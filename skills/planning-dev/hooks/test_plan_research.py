import unittest

from plan_research import verify_quotes

SOURCE = """## 요구사항

- R7: 색인의 처리 대상 쿼리는 `plan_files.owner`로 스위치와 조인한다.
  지울 대상과 스위치 끄기는   `plan_index_files.owner`를 쓴다.
"""


def quote(text):
    return {"source": "requirements", "heading": "요구사항", "text": text}


class VerifyQuotesTest(unittest.TestCase):
    def test_keeps_quote_found_in_source(self):
        kept, dropped = verify_quotes([quote("R7: 색인의 처리 대상 쿼리는 `plan_files.owner`로 스위치와 조인한다.")], SOURCE)
        self.assertEqual(len(kept), 1)
        self.assertEqual(dropped, 0)

    def test_drops_quote_not_in_source(self):
        kept, dropped = verify_quotes([quote("R7: 색인 대상은 owner 열로 고른다.")], SOURCE)
        self.assertEqual(kept, [])
        self.assertEqual(dropped, 1)

    def test_ignores_whitespace_differences(self):
        kept, dropped = verify_quotes([quote("조인한다. 지울 대상과 스위치 끄기는 `plan_index_files.owner`를 쓴다.")], SOURCE)
        self.assertEqual(len(kept), 1)
        self.assertEqual(dropped, 0)

    def test_drops_quote_over_300_chars(self):
        long_source = "가" * 400
        kept, dropped = verify_quotes([quote("가" * 301)], long_source)
        self.assertEqual(kept, [])
        self.assertEqual(dropped, 1)

    def test_drops_empty_quote(self):
        kept, dropped = verify_quotes([quote("   ")], SOURCE)
        self.assertEqual(kept, [])
        self.assertEqual(dropped, 1)


if __name__ == "__main__":
    unittest.main()
