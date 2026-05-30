using System;
using System.Collections.Generic;

namespace Pak.Models;

public class Exam
{
    public string Id { get; set; } = "";
    public string Title { get; set; } = "Экзаменационный билет";
    public string Subject { get; set; } = "Физика";
    public string SubjectAbbr { get; set; } = "ФИЗ";
    public string InstitutionCode { get; set; } = "НХД";
    public string Institution { get; set; } = "МГУ им. Невельского";
    public string Author { get; set; } = "";
    public int Variant { get; set; } = 1;
    public int Year { get; set; } = DateTime.Now.Year;
    public string CreatedAt { get; set; } = DateTime.Now.ToString("o");
    public int? TimeLimit { get; set; }
    public bool ShuffleQuestions { get; set; }
    public bool ShuffleOptions { get; set; }
    public double DefaultPoints { get; set; } = 1;
    public List<Question> Questions { get; set; } = new();
}

// Тип: single, multi, open, match, fillblank
public class Question
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Type { get; set; } = "single";
    public string Text { get; set; } = "";
    public string? Image { get; set; }
    public double Points { get; set; } = 1;

    public List<string> Options { get; set; } = new();
    public int Correct { get; set; } = 0;
    public List<int> CorrectMulti { get; set; } = new();

    public string? Answer { get; set; }

    public List<MatchPair> Pairs { get; set; } = new();

    public string Template { get; set; } = "";
    public List<string> Answers { get; set; } = new();
}

public class MatchPair
{
    public string Left { get; set; } = "";
    public string Right { get; set; } = "";
}
