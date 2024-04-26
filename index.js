const express = require("express");
const app = express();
const cors = require("cors");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());

const CheckCreateReq = (req) => {
  if (!req.title || req.title === "" || req.title === null) {
    return "タイトルを設定してください";
  } else if (!req.priority || req.priority === "" || req.priority === null) {
    return "優先度を設定してください";
  } else if (
    !req.difficulty ||
    req.difficulty === "" ||
    req.difficulty === null
  ) {
    return "難易度を設定してください";
  } else if (
    req.results.length &&
    (!req.question_format ||
      req.question_format === "" ||
      req.question_format === null)
  ) {
    return "問題の出題形式を設定してください";
  } else {
    return null;
  }
};

// GET
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/api/data", async (req, res) => {
  try {
    resData = await executeSelectQuery();
    res.json({ message: "成功しました::Data retrieved successfully", resData });
  } catch (error) {
    res
      .status(500)
      .json({ message: "An error occurred while fetching data", error });
  }
});

app.get("/api/list", async (req, res) => {
  try {
    const data = await ListSelectQuery();
    res.json({ message: "一覧取得成功しました", data });
  } catch (error) {
    res
      .status(500)
      .json({ message: "一覧取得でエラーが発生しました。", error });
  }
});

app.get("/api/resultList", async (req, res) => {
  try {
    const data = await ResultsSelectQuery();
    res.json({ message: "結果一覧の取得が成功しました。", data });
  } catch (error) {
    res
      .status(500)
      .json({ message: "一覧取得でエラーが発生しました。", error });
  }
});

app.get("/api/updatelist", async (req, res) => {
  try {
    const data = await UpdateTitleSelectQuery(req.query.updateId);
    res.json({ message: "結果一覧の取得が成功しました。", data });
  } catch (error) {
    res
      .status(500)
      .json({ message: "一覧取得でエラーが発生しました。", error });
  }
});

// POST
app.post("/api/create", async (req, res) => {
  const errorMessage = CheckCreateReq(req.body);

  if (errorMessage) {
    // 問題がある場合はエラーレスポンスを返す
    return res.status(400).json({ message: errorMessage });
  }

  try {
    const titleInsertResult = await TitleInsertQuery(req.body);

    // 追加されたデータのIDを取得
    const titleId = titleInsertResult.insertId;

    if (0 < req.body.results.length) {
      data = await ResultsInsertQuery(titleId, req.body);
    }

    res.json({
      message: "追加成功しました::Data retrieved successfully::",
      // data,
      titleInsertResult,
    });
  } catch (error) {
    // エラーが発生した場合に適切なエラーメッセージを返す
    res
      .status(500)
      .json({ message: "データの作成中にエラーが発生しました", error });
  }
});

// PUT
app.put("/api/update", async (req, res) => {
  try {
    // const errorMessage = CheckCreateReq(req.body);

    // if (errorMessage) {
    //   // 問題がある場合はエラーレスポンスを返す
    //   return res.status(400).json({ message: errorMessage });
    // }
  
    const titleUpdate = await TitleUpdateQuery(req.body);

    if (0 < req.body.results.length) {
      const resultUpdate = await ResultUpdateQuery(req.body);
    }

    res.json({
      message: "タイトル更新と解答結果の更新が成功しました。",
      titleUpdate,
      // resultUpdate,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "An error occurred while fetching data", error });
  }
});

// DELETE
app.delete("/api/deleteList/:id", async (req, res) => {
  const delId = req.params.id;
  try {
    await ResultsDeletetQuery(delId);
    const data = await TitleDeletetQuery(delId);
    // const ResultDeleteData = await TitleDeletetQuery(delId);

    res.json({
      message: `タイトル::$}の削除成功しました。+ ID::${delId}`,
      data,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "一件削除でエラーが発生しました。", error });
  }
});

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});

const mysql = require("mysql");

const connection = mysql.createConnection({
//各々の設定でお願いします
});

connection.connect();

// SELECTクエリを実行する関数
async function executeSelectQuery() {
  return new Promise((resolve, reject) => {
    const query = "SELECT * FROM titles"; // 適切なテーブル名に変更する
    connection.query(query, (err, results) => {
      if (err) {
        console.error("SELECTクエリの実行エラー:", err);
        reject(err);
      } else {
        console.log("クエリ結果:", results);
        resolve(results);
      }
    });
  });
}

// SELECTクエリを実行する関数(一覧取得)
const ListSelectQuery = async () => {
  return new Promise((resolve, reject) => {
    const query = "SELECT * FROM titles";

    connection.query(query, (err, results) => {
      if (err) {
        console.error("SELECTクエリの実行エラー:", err);
        reject(err);
      } else {
        console.log("クエリ結果:", results);
        resolve(results);
      }
    });
  });
};

// SELECTクエリを実行する関数(一覧取得)
const ResultsSelectQuery = async () => {
  return new Promise((resolve, reject) => {
    const query = "SELECT * FROM title_problem_date";

    connection.query(query, (err, results) => {
      if (err) {
        console.error("SELECTクエリの実行エラー:", err);
        reject(err);
      } else {
        console.log("クエリ結果:", results);
        resolve(results);
      }
    });
  });
};

// SELECTクエリを実行する関数(更新するタイトル)
const UpdateTitleSelectQuery = async (req) => {
  return new Promise((resolve, reject) => {
    const values = [req];

    // const query = `
    //   SELECT i.*, pd.problem_number, pd.answer, pd.worked_date, pd.id
    //   FROM itemdb.titles AS i
    //   LEFT JOIN itemdb.title_problem_date AS pd ON i.id = pd.title_id
    //   WHERE i.id = ?;
    // `;

    const query = `
      SELECT i.*, pd.problem_number, pd.answer, DATE_FORMAT(pd.worked_date, '%Y-%m-%d') AS worked_date, pd.id
      FROM itemdb.titles AS i
      LEFT JOIN itemdb.title_problem_date AS pd ON i.id = pd.title_id
      WHERE i.id = ?;
    `;

    // const query = `
    //   SELECT i.*, pd.problem_number, pd.answer, pd.worked_date
    //   FROM itemdb.titles AS i
    //   INNER JOIN itemdb.title_problem_date AS pd ON i.id = pd.title_id
    //   WHERE i.id = ?;
    // `;

    connection.query(query, values, (err, results) => {
      if (err) {
        console.error("SELECTクエリの実行エラー:", err);
        reject(err);
      } else {
        console.log("クエリ結果:", results);
        resolve(results);
      }
    });
  });
};

// DELETEクエリを実行する関数(一件削除)
const TitleDeletetQuery = async (req) => {

  return new Promise((resolve, reject) => {
    const values = [req];
    const query = "DELETE FROM titles WHERE id = ?";

    connection.query(query, values, (err, results) => {
      if (err) {
        console.error("DELETEクエリの実行エラー:", err);
        reject(err);
      } else {
        console.log("タイトル一覧削除のクエリ結果:", results);
        resolve(results);
      }
    });
  });
};
// DELETEクエリを実行する関数(一件削除)
const ResultsDeletetQuery = async (req) => {
  return new Promise((resolve, reject) => {
    const values = [req];
    const query = "DELETE FROM title_problem_date WHERE title_id = ?";

    connection.query(query, values, (err, results) => {
      if (err) {
        console.error("DELETEクエリの実行エラー:", err);
        reject(err);
      } else {
        console.log("クエリ結果:", results);
        resolve(results);
      }
    });
  });
};

// INSERTクエリを実行する関数
async function TitleInsertQuery(req) {
  return new Promise((resolve, reject) => {
    const { title, description, priority, difficulty, question_format } = req;
    const values = [title, description, priority, difficulty, question_format];
    const query = `
  INSERT INTO titles(title, description, priority, difficulty, question_format)
  VALUES(?,?,?,?,?)
  `;

    connection.query(query, values, (err, results) => {
      if (err) {
        console.error("SELECTクエリの実行エラー:", err);
        reject(err);
      } else {
        console.log("クエリ結果:", results);
        resolve(results);
      }
    });
  });
}

// INSERTクエリを実行する関数
async function ResultsInsertQuery(titleId, req) {

  return new Promise((resolve, reject) => {
    const queries = req.results.map(({ problemNumber, workedDate, answer }) => {
      const values = [titleId, problemNumber, workedDate, answer];
      console.log("values::", values); // VALUESの確認

      const querie = `
        INSERT INTO title_problem_date(title_id, problem_number, worked_date, answer)
        VALUES(?,?,?,?)
      `;

      connection.query(querie, values, (err, results) => {
        if (err) {
          console.error("SELECTクエリの実行エラー:", err);
          reject(err);
        } else {
          console.log("クエリ結果:", results);
          resolve(results);
        }
      });
    });
  });
}

// UPDATEクエリを実行する関数
async function TitleUpdateQuery(req) {
  console.log("UPDATEリクエスト::", req); // 受け取ったデータをログに出力する

  return new Promise((resolve, reject) => {
    const { title, description, priority, difficulty, question_format, id } =
      req;

    const values = [
      title,
      description,
      priority,
      difficulty,
      question_format,
      id,
    ];
    const querie = `
        UPDATE titles
        SET title = ?,
        description= ?,
        priority = ?,
        difficulty = ?,
        question_format = ?
        WHERE id = ?
        `;
    connection.query(querie, values, (err, results) => {
      if (err) {
        console.error("UPDATEクエリの実行エラー:", err);
        reject(err);
      } else {
        console.log("UPDATE文のクエリ結果は以下です:", results);
        resolve(results);
      }
    });
  });
}

// UPDATEクエリを実行する関数
async function ResultUpdateQuery(req) {
  return new Promise((resolve, reject) => {
    const queries = req.results.map(({ problem_number, date, answer }) => {
      const values = [req.id, problem_number, date, answer];
      console.log("values::", values); // VALUESの確認

      const querie = `
        INSERT INTO title_problem_date(title_id, problem_number, worked_date, answer)
        VALUES(?,?,?,?)
      `;

      connection.query(querie, values, (err, results) => {
        if (err) {
          console.error("SELECTクエリの実行エラー:", err);
          reject(err);
        } else {
          console.log("クエリ結果:", results);
          resolve(results);
        }
      });
    });
  });
}
